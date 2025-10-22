# payments/views.py - KEEP THIS CLEAN, ONLY FOR WEBHOOK
import logging
import stripe
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from orders.models import Order
from .models import Payment
from cart.models import Cart

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY

@method_decorator(csrf_exempt, name='dispatch')
class PaymentWebhookAPIView(APIView):
    """
    Stripe Webhook Endpoint
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        if not webhook_secret:
            logger.error("STRIPE_WEBHOOK_SECRET not configured")
            return Response({
                "success": False,
                "error": "Webhook secret not configured"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not sig_header:
            logger.error("Missing Stripe signature header")
            return Response({
                "success": False,
                "error": "Missing Stripe signature"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            logger.info(f"Processing Stripe event: {event.type}")
            
            if event.type == 'checkout.session.completed':
                return self.handle_checkout_session_completed(event)
            elif event.type == 'payment_intent.succeeded':
                return self.handle_payment_intent_succeeded(event)
            elif event.type == 'payment_intent.payment_failed':
                return self.handle_payment_intent_failed(event)
            else:
                logger.info(f"Unhandled event type: {event.type}")
                return Response({"success": True}, status=status.HTTP_200_OK)
                
        except ValueError as e:
            logger.error(f"Invalid Stripe webhook payload: {str(e)}")
            return Response({"error": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid Stripe webhook signature: {str(e)}")
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Webhook processing error: {str(e)}")
            return Response({"error": "Webhook processing failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def handle_checkout_session_completed(self, event):
        """Handle completed checkout session"""
        session = event.data.object
        logger.info(f"Processing checkout.session.completed: {session.id}")
        
        order_id = session.metadata.get('order_id')
        if not order_id:
            logger.error(f"No order_id in session metadata: {session.id}")
            return Response({"error": "No order_id in metadata"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id)
            
            if session.payment_status == 'paid':
                order.payment_status = Order.PaymentStatus.SUCCESS
                order.status = Order.Status.PAID
                order.payment_id = session.payment_intent
                order.payment_gateway = 'stripe'
                order.save()

                # Update payment record
                Payment.objects.update_or_create(
                    order=order,
                    stripe_session_id=session.id,
                    defaults={
                        'amount': session.amount_total / 100,
                        'status': 'completed'
                    }
                )

                # Clear cart
                cart_id = session.metadata.get('cart_id')
                if cart_id:
                    try:
                        cart = Cart.objects.get(id=cart_id)
                        cart.items.all().delete()
                        logger.info(f"Cart {cart_id} cleared via webhook")
                    except Cart.DoesNotExist:
                        logger.warning(f"Cart {cart_id} not found")

                logger.info(f"Order {order.id} completed via webhook")
                
            return Response({"success": True}, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found")
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    def handle_payment_intent_succeeded(self, event):
        """Handle successful payment intent"""
        payment_intent = event.data.object
        logger.info(f"Payment intent succeeded: {payment_intent.id}")
        return Response({"success": True}, status=status.HTTP_200_OK)

    def handle_payment_intent_failed(self, event):
        """Handle failed payment intent"""
        payment_intent = event.data.object
        logger.warning(f"Payment intent failed: {payment_intent.id}")
        return Response({"success": True}, status=status.HTTP_200_OK)