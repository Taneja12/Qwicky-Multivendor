import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as rest_status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from cart.models import Cart
from orders.models import Order
from vendors.models import VendorProfile
from .models import Payment
import logging

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionAPIView(APIView):
    if settings.DEBUG:
        permission_classes = [permissions.AllowAny]
    else:
        permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        cart_id = request.data.get('cartId')
        order_id = request.data.get('orderId')  # Add support for existing orders
        
        if not cart_id and not order_id:
            return Response({'error': 'cartId or orderId is required'}, status=rest_status.HTTP_400_BAD_REQUEST)

        order = None
        
        # If orderId is provided, use existing order
        if order_id:
            try:
                order = Order.objects.get(id=order_id, user=request.user)
                cart_id = order.cart_id  # Get cart from order if needed
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=rest_status.HTTP_404_NOT_FOUND)
        
        # If no existing order, get cart and create order
        if not order:
            try:
                if settings.DEBUG and not request.user.is_authenticated:
                    cart = Cart.objects.prefetch_related('items__product').get(id=cart_id)
                else:
                    cart = Cart.objects.prefetch_related('items__product').get(id=cart_id, user=request.user)
            except Cart.DoesNotExist:
                return Response({'error': 'Cart not found'}, status=rest_status.HTTP_404_NOT_FOUND)

            if not cart.items.exists():
                return Response({'error': 'Cart is empty'}, status=rest_status.HTTP_400_BAD_REQUEST)

            # Calculate total amount and build line items
            total_amount = 0
            line_items = []
            
            for item in cart.items.all():
                product = item.product
                
                if not product.price or float(product.price) <= 0:
                    return Response(
                        {'error': f'Invalid price for product: {product.name}'},
                        status=rest_status.HTTP_400_BAD_REQUEST
                    )
                
                unit_amount = int(round(float(product.price) * 100))
                total_amount += unit_amount * item.quantity
                
                line_items.append({
                    'price_data': {
                        'currency': 'inr',
                        'unit_amount': unit_amount,
                        'product_data': {
                            'name': product.name,
                            'description': product.description[:500] if product.description else f'{product.name} - Quantity: {item.quantity}',
                        },
                    },
                    'quantity': item.quantity,
                })

            # Get vendor
            vendor = None
            if hasattr(cart, 'canteen') and cart.canteen:
                vendor = cart.canteen.vendors.first()
            
            if not vendor:
                return Response({'error': 'No vendor found'}, status=rest_status.HTTP_400_BAD_REQUEST)

            # Create new order
            order = Order.objects.create(
                user=cart.user,
                vendor=vendor,
                total_amount=total_amount / 100,
                status=Order.Status.PENDING_PAYMENT,
                payment_status=Order.PaymentStatus.PENDING
            )

            # Add order items
            for item in cart.items.all():
                order.items.create(
                    product=item.product,
                    quantity=item.quantity,
                    unit_price=item.product.price,
                    note=item.note or ''
                )
        else:
            # Use existing order, calculate line items from order items
            line_items = []
            total_amount = 0
            
            for item in order.items.all():
                unit_amount = int(round(float(item.unit_price) * 100))
                total_amount += unit_amount * item.quantity
                
                line_items.append({
                    'price_data': {
                        'currency': 'inr',
                        'unit_amount': unit_amount,
                        'product_data': {
                            'name': item.product.name,
                            'description': f'{item.product.name} - Quantity: {item.quantity}',
                        },
                    },
                    'quantity': item.quantity,
                })

        try:
            # Create checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=f"{settings.FRONTEND_URL}/orders/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/cart",
                metadata={
                    'cart_id': str(cart_id) if cart_id else '',
                    'order_id': str(order.id),
                    'user_id': str(request.user.id) if request.user.is_authenticated else 'anonymous',
                    'vendor_id': str(order.vendor.id)
                },
                customer_email=request.user.email if request.user.is_authenticated else None,
            )
            
            # Create/update payment record
            Payment.objects.update_or_create(
                order=order,
                defaults={
                    'stripe_session_id': session.id,
                    'amount': total_amount / 100,
                    'status': 'pending'
                }
            )
            
            logger.info(f"Created checkout session {session.id} for order {order.id}")
            
            return Response({
                'url': session.url,
                'sessionId': session.id,
                'orderId': order.id
            })
            
        except stripe.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return Response(
                {'error': f'Payment service error: {str(e)}'}, 
                status=rest_status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            return Response(
                {'error': f'Internal server error: {str(e)}'}, 
                status=rest_status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        cart_id = request.data.get('cartId')
        if not cart_id:
            return Response({'error': 'cartId is required'}, status=rest_status.HTTP_400_BAD_REQUEST)

        try:
            # Handle both authenticated and unauthenticated users in DEBUG mode
            if settings.DEBUG and not request.user.is_authenticated:
                cart = Cart.objects.prefetch_related('items__product').get(id=cart_id)
            else:
                cart = Cart.objects.prefetch_related('items__product').get(id=cart_id, user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=rest_status.HTTP_404_NOT_FOUND)

        # Validate cart has items
        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=rest_status.HTTP_400_BAD_REQUEST)

        # Calculate total amount and build line items
        total_amount = 0
        line_items = []
        
        for item in cart.items.all():
            product = item.product
            
            # Validate product price
            if not product.price or float(product.price) <= 0:
                return Response(
                    {'error': f'Invalid price for product: {product.name}'},
                    status=rest_status.HTTP_400_BAD_REQUEST
                )
            
            unit_amount = int(round(float(product.price) * 100))
            total_amount += unit_amount * item.quantity
            
            line_items.append({
                'price_data': {
                    'currency': 'inr',
                    'unit_amount': unit_amount,
                    'product_data': {
                        'name': product.name,
                        'description': product.description[:500] if product.description else f'{product.name} - Quantity: {item.quantity}',
                    },
                },
                'quantity': item.quantity,
            })

        try:
            # Get vendor from cart's canteen - CORRECTED
            vendor = None
            if hasattr(cart, 'canteen') and cart.canteen:
                # Get the first vendor for this canteen (since canteen can have multiple vendors)
                vendor = cart.canteen.vendors.first()  # CORRECTED: using 'vendors' reverse relationship
            
            if not vendor:
                # Try to get vendor from product if canteen doesn't have vendors
                first_product = cart.items.first().product
                if hasattr(first_product, 'vendor'):
                    vendor = first_product.vendor
                elif hasattr(first_product, 'canteen'):
                    vendor = first_product.canteen.vendors.first()

            if not vendor:
                return Response(
                    {'error': 'No vendor found for this cart. Please contact support.'}, 
                    status=rest_status.HTTP_400_BAD_REQUEST
                )

            # Create order first
            order = Order.objects.create(
                user=cart.user,
                vendor=vendor,
                total_amount=total_amount / 100,
                status=Order.Status.PENDING_PAYMENT,
                payment_status=Order.PaymentStatus.PENDING
            )

            # Add order items
            for item in cart.items.all():
                order_item = order.items.create(
                    product=item.product,
                    quantity=item.quantity,
                    unit_price=item.product.price,
                    note=item.note or ''
                )

            # Create checkout session with order ID in metadata
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=f"{settings.FRONTEND_URL}/orders/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/cart",
                metadata={
                    'cart_id': str(cart.id),
                    'order_id': str(order.id),
                    'user_id': str(request.user.id) if request.user.is_authenticated else 'anonymous',
                    'vendor_id': str(vendor.id)
                },
                customer_email=request.user.email if request.user.is_authenticated else None,
            )
            
            # Create pending payment record
            Payment.objects.create(
                order=order,
                stripe_session_id=session.id,
                amount=total_amount / 100,
                status='pending'
            )
            
            logger.info(f"Created checkout session {session.id} for order {order.id} with vendor {vendor.business_name}")
            
            return Response({
                'url': session.url,
                'sessionId': session.id,
                'orderId': order.id
            })
            
        except stripe.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {str(e)}")
            return Response(
                {'error': f'Payment service error: {str(e)}'}, 
                status=rest_status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            return Response(
                {'error': f'Internal server error: {str(e)}'}, 
                status=rest_status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """
    Verify payment status after redirect from Stripe Checkout
    """
    try:
        session_id = request.data.get('session_id') or request.data.get('sessionId')
        if not session_id:
            return Response({'error': 'Session ID is required'}, status=rest_status.HTTP_400_BAD_REQUEST)

        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        logger.info(f"Verifying payment for session: {session.id}, status: {session.payment_status}")
        
        # Get order ID from metadata
        order_id = session.metadata.get('order_id')
        if not order_id:
            return Response({'error': 'Order ID not found in session metadata'}, status=rest_status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found for user {request.user.id}")
            return Response({'error': 'Order not found'}, status=rest_status.HTTP_404_NOT_FOUND)

        if session.payment_status == 'paid':
            # Update order status
            order.payment_status = Order.PaymentStatus.SUCCESS
            order.status = Order.Status.PAID
            order.payment_id = session.payment_intent
            order.payment_gateway = 'stripe'
            order.save()

            # Update payment record
            payment = Payment.objects.filter(
                stripe_session_id=session_id,
                order=order
            ).first()
            
            if payment:
                payment.status = 'completed'
                payment.save()
            else:
                # Create payment record if it doesn't exist
                payment = Payment.objects.create(
                    order=order,
                    stripe_session_id=session_id,
                    amount=session.amount_total / 100,
                    status='completed'
                )

            # Clear the cart
            cart_id = session.metadata.get('cart_id')
            if cart_id:
                try:
                    cart = Cart.objects.get(id=cart_id, user=request.user)
                    cart.items.all().delete()
                    logger.info(f"Cart {cart_id} cleared for user {request.user.id}")
                except Cart.DoesNotExist:
                    logger.warning(f"Cart {cart_id} not found for clearing")

            logger.info(f"Payment verified successfully for order {order.id}")
            
            return Response({
                'success': True,
                'orderId': order.id,
                'paymentId': payment.id,
                'payment_status': 'completed',
                'message': 'Payment verified successfully'
            })
            
        else:
            # Payment not completed
            order.payment_status = Order.PaymentStatus.FAILED
            order.status = Order.Status.PAYMENT_FAILED
            order.save()

            # Update payment record
            Payment.objects.filter(
                stripe_session_id=session_id,
                order=order
            ).update(status='failed')

            logger.warning(f"Payment not completed for order {order.id}, status: {session.payment_status}")
            
            return Response({
                'error': 'Payment not completed', 
                'payment_status': session.payment_status,
                'orderId': order.id
            }, status=rest_status.HTTP_400_BAD_REQUEST)

    except stripe.StripeError as e:
        logger.error(f"Stripe error in verify_payment: {str(e)}")
        return Response({'error': f'Payment verification error: {str(e)}'}, status=rest_status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in verify_payment: {str(e)}")
        return Response({'error': f'Server error: {str(e)}'}, status=rest_status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        return HttpResponse('Webhook secret not configured', status=500)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        logger.info(f"Received Stripe webhook event: {event['type']}")
    except ValueError as e:
        logger.error(f"Invalid payload in webhook: {str(e)}")
        return HttpResponse('Invalid payload', status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature in webhook: {str(e)}")
        return HttpResponse('Invalid signature', status=400)
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return HttpResponse('Webhook error', status=400)

    # Handle different event types
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        logger.info(f"Processing checkout.session.completed: {session.id}")
        
        order_id = session.metadata.get('order_id')
        cart_id = session.metadata.get('cart_id')
        
        if order_id:
            try:
                order = Order.objects.get(id=order_id)
                
                if session.payment_status == 'paid':
                    # Update order status
                    order.payment_status = Order.PaymentStatus.SUCCESS
                    order.status = Order.Status.PAID
                    order.payment_id = session.payment_intent
                    order.payment_gateway = 'stripe'
                    order.save()

                    # Update payment record
                    payment, created = Payment.objects.update_or_create(
                        order=order,
                        stripe_session_id=session.id,
                        defaults={
                            'amount': session.amount_total / 100,
                            'status': 'completed'
                        }
                    )

                    # Clear cart
                    if cart_id:
                        try:
                            cart = Cart.objects.get(id=cart_id)
                            cart.items.all().delete()
                            logger.info(f"Cart {cart_id} cleared via webhook")
                        except Cart.DoesNotExist:
                            logger.warning(f"Cart {cart_id} not found for clearing via webhook")

                    logger.info(f"Order {order.id} completed via webhook")
                    
                else:
                    # Payment failed in webhook
                    order.payment_status = Order.PaymentStatus.FAILED
                    order.status = Order.Status.PAYMENT_FAILED
                    order.save()
                    
                    Payment.objects.filter(
                        order=order,
                        stripe_session_id=session.id
                    ).update(status='failed')
                    
                    logger.warning(f"Order {order.id} payment failed via webhook, status: {session.payment_status}")

            except Order.DoesNotExist:
                logger.error(f"Order {order_id} not found in webhook")
                return HttpResponse('Order not found', status=404)
            except Exception as e:
                logger.error(f"Error processing webhook for order {order_id}: {str(e)}")
                return HttpResponse('Error processing order', status=500)

    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        order_id = session.metadata.get('order_id')
        
        if order_id:
            try:
                order = Order.objects.get(id=order_id)
                order.payment_status = Order.PaymentStatus.FAILED
                order.status = Order.Status.PAYMENT_FAILED
                order.save()
                
                Payment.objects.filter(
                    order=order,
                    stripe_session_id=session.id
                ).update(status='failed')
                
                logger.info(f"Order {order.id} expired via webhook")
            except Order.DoesNotExist:
                logger.warning(f"Order {order_id} not found for expired session")

    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        logger.info(f"Payment intent succeeded: {payment_intent.id}")

    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        logger.warning(f"Payment intent failed: {payment_intent.id}")

    else:
        logger.info(f"Unhandled webhook event type: {event['type']}")

    return HttpResponse(status=200)