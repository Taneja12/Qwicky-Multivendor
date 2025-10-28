from django.db import models
from django.conf import settings
from products.models import Product

class UserRecommendation(models.Model):
    ALGORITHM_CHOICES = [
        ('order_based', 'Order Based'),
        ('collaborative', 'Collaborative Filtering'),
        ('content_based', 'Content Based'),
        ('seasonal', 'Seasonal/Time Based'),
        ('trending', 'Trending'),
        ('frequently_bought_together', 'Frequently Bought Together'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='recommendations'
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE,
        related_name='recommendations'
    )
    score = models.FloatField(
        default=0.0,
        help_text="Recommendation confidence score (0.0 - 1.0)"
    )
    algorithm = models.CharField(
        max_length=50, 
        choices=ALGORITHM_CHOICES,
        help_text="Algorithm used for this recommendation"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this recommendation should be refreshed"
    )
    
    class Meta:
        db_table = 'user_recommendations'
        unique_together = ['user', 'product']
        ordering = ['-score', '-created_at']
        indexes = [
            models.Index(fields=['user', 'score']),
            models.Index(fields=['algorithm', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.algorithm})"
    
    def save(self, *args, **kwargs):
        # Set expiration to 24 hours from creation
        from datetime import timedelta
        from django.utils import timezone
        
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)