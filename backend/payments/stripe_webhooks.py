from django.conf import settings
import stripe
from .models import PaymentIntent, StripeCustomer
from orders.models import Order
from cart.models import Cart

stripe.api_key = settings.STRIPE_SECRET_KEY

def handle_payment_intent_succeeded(event):
    """Handle successful payment intent"""
    intent = event.data.object
    payment_intent = PaymentIntent.objects.filter(
        stripe_payment_intent_id=intent.id
    ).first()

    if not payment_intent:
        return

    # Update payment intent status
    payment_intent.status = PaymentIntent.Status.SUCCEEDED
    payment_intent.save()

    cart = payment_intent.cart
    if not cart:
        return

    # Create order from cart
    order = Order.objects.create(
        user=payment_intent.user,
        vendor=cart.canteen.vendor_profile,
        status=Order.Status.PAID,
        payment_id=intent.id,
        payment_status=Order.PaymentStatus.SUCCESS,
        payment_gateway='stripe',
        total_amount=cart.total_price or 0
    )

    # Create order items
    for cart_item in cart.items.all():
        order_item = order.items.create(
            product=cart_item.product,
            quantity=cart_item.quantity,
            unit_price=cart_item.product.price,
            note=cart_item.note
        )

    # Clear the cart after successful order
    cart.delete()

def handle_payment_intent_failed(event):
    """Handle failed payment intent"""
    intent = event.data.object
    payment_intent = PaymentIntent.objects.filter(
        stripe_payment_intent_id=intent.id
    ).first()

    if payment_intent:
        payment_intent.status = PaymentIntent.Status.FAILED
        payment_intent.save()

def handle_payment_intent_canceled(event):
    """Handle canceled payment intent"""
    intent = event.data.object
    payment_intent = PaymentIntent.objects.filter(
        stripe_payment_intent_id=intent.id
    ).first()

    if payment_intent:
        payment_intent.status = PaymentIntent.Status.CANCELLED
        payment_intent.save()

def handle_customer_created(event):
    """Handle customer creation"""
    customer = event.data.object
    user_email = customer.email

    # Find user by email and create StripeCustomer record
    User = settings.AUTH_USER_MODEL
    user = User.objects.filter(email=user_email).first()
    if user:
        StripeCustomer.objects.create(
            user=user,
            stripe_customer_id=customer.id
        )

EVENT_HANDLERS = {
    'payment_intent.succeeded': handle_payment_intent_succeeded,
    'payment_intent.payment_failed': handle_payment_intent_failed,
    'payment_intent.canceled': handle_payment_intent_canceled,
    'customer.created': handle_customer_created,
}