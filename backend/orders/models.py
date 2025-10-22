from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from products.models import Product, CustomizationOption
from vendors.models import VendorProfile

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = 'PENDING_PAYMENT', 'Pending Payment'
        PAYMENT_FAILED = 'PAYMENT_FAILED', 'Payment Failed'
        PAID = 'PAID', 'Paid'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PREPARING = 'PREPARING', 'Preparing'
        READY = 'READY', 'Ready for Pickup'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    
    # Payment fields
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    payment_gateway = models.CharField(max_length=50, blank=True, null=True)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    payment_signature = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    pickup_time = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.email}"

    class Meta:
        ordering = ['-created_at']

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order
    note = models.TextField(blank=True)

    def get_total_price(self):
        base_price = self.unit_price * self.quantity
        customizations_price = sum(c.price_at_time for c in self.customizations.all())
        return base_price + (customizations_price * self.quantity)

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

class OrderItemCustomization(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='customizations')
    option = models.ForeignKey(CustomizationOption, on_delete=models.CASCADE)
    name_at_time = models.CharField(max_length=100)  # Name at time of order
    price_at_time = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order

    def __str__(self):
        return f"{self.name_at_time} for {self.order_item}"

class PaymentHistory(Order):
    """
    Proxy model for Order to provide a payment-focused view in admin.
    This allows us to register the same model twice in admin with different configurations.
    """
    class Meta:
        proxy = True
        verbose_name = 'Payment Record'
        verbose_name_plural = 'Payment Records'
