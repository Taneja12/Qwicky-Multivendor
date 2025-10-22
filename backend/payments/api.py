import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from cart.models import Cart

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionAPIView(APIView):
    # In local development allow unauthenticated checkout creation to simplify testing.
    # In production (DEBUG=False) this will enforce authentication.
    if settings.DEBUG:
        permission_classes = [permissions.AllowAny]
    else:
        permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        cart_id = request.data.get('cartId')
        if not cart_id:
            return Response({'error': 'cartId is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.prefetch_related('items__product').get(id=cart_id, user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)

        # Build line items
        line_items = []
        for item in cart.items.all():
            product = item.product
            unit_amount = int(round(float(product.price) * 100))
            line_items.append({
                'price_data': {
                    'currency': 'inr',
                    'unit_amount': unit_amount,
                    'product_data': {
                        'name': product.name,
                        'description': product.description or '',
                    },
                },
                'quantity': item.quantity,
            })

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=request.build_absolute_uri('/orders/success/'),
                cancel_url=request.build_absolute_uri('/cart/'),
                metadata={'cart_id': str(cart.id)},
            )
            return Response({'sessionId': session.id})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
