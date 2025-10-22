from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from products.models import Product, CustomizationOption
from vendors.models import Canteen


class Cart(models.Model):
    # A cart is specific to a user and a canteen (separate carts per canteen)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carts')
    canteen = models.ForeignKey(Canteen, on_delete=models.CASCADE, related_name='carts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'canteen')

    def get_total_price(self):
        return sum(item.get_total_price() for item in self.items.all())

    def __str__(self):
        return f"Cart for {self.user.email} @ {self.canteen.name}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_total_price(self):
        base_price = self.product.price * self.quantity
        customizations_price = sum(c.option.price_addition for c in self.customizations.all())
        return base_price + (customizations_price * self.quantity)

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    class Meta:
        ordering = ['-created_at']

class CartItemCustomization(models.Model):
    cart_item = models.ForeignKey(CartItem, on_delete=models.CASCADE, related_name='customizations')
    option = models.ForeignKey(CustomizationOption, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.option.name} for {self.cart_item}"

    class Meta:
        unique_together = ('cart_item', 'option')
