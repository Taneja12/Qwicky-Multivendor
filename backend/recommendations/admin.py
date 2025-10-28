from django.contrib import admin
from .models import UserRecommendation

@admin.register(UserRecommendation)
class UserRecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'algorithm', 'score', 'created_at', 'expires_at']
    list_filter = ['algorithm', 'created_at']
    search_fields = ['user__email', 'product__name']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'product')