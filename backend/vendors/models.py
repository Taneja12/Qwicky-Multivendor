from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from cloudinary.models import CloudinaryField

class Canteen(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    image = CloudinaryField('image', folder='canteens', null=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class VendorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vendor_profile')
    canteen = models.ForeignKey(Canteen, on_delete=models.CASCADE, related_name='vendors',  null=True, blank=True)
    business_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    avg_preparation_time = models.PositiveIntegerField(
        help_text=_("Average preparation time in minutes"),
        validators=[MinValueValidator(1), MaxValueValidator(120)]
    )
    is_open = models.BooleanField(default=False)
    
    # Operating hours
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    
    # Days of operation
    monday = models.BooleanField(default=True)
    tuesday = models.BooleanField(default=True)
    wednesday = models.BooleanField(default=True)
    thursday = models.BooleanField(default=True)
    friday = models.BooleanField(default=True)
    saturday = models.BooleanField(default=False)
    sunday = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name} at {self.canteen.name}"

    class Meta:
        ordering = ['canteen', 'business_name']
