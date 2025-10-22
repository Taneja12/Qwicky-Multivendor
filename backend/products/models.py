from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from vendors.models import VendorProfile
from cloudinary.models import CloudinaryField

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'

class Product(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    image = CloudinaryField('image', folder='products', null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_veg = models.BooleanField(default=False)
    preparation_time = models.PositiveIntegerField(
        help_text=_("Preparation time in minutes"),
        validators=[MinValueValidator(1)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} by {self.vendor.business_name}"

    class Meta:
        ordering = ['vendor', 'category', 'name']

class CustomizationOption(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='customization_options')
    name = models.CharField(max_length=100)
    price_addition = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} for {self.product.name}"
