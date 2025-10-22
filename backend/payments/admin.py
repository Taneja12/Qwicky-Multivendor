from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from orders.models import PaymentHistory

@admin.register(PaymentHistory)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface focused on payment tracking and management."""
    
    list_display = [
        'id', 'user_link', 'total_amount', 'payment_status_badge',
        'payment_gateway', 'payment_id', 'transaction_id', 'created_at'
    ]
    list_filter = [
        'payment_status', 'payment_gateway', 'status',
        'created_at'
    ]
    search_fields = [
        'id', 'user__email', 'payment_id',
        'transaction_id', 'vendor__business_name'
    ]
    readonly_fields = [
        'id', 'user', 'vendor', 'total_amount', 'status',
        'payment_status', 'payment_id', 'transaction_id',
        'payment_gateway', 'payment_signature', 'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Payment Information', {
            'fields': (
                'payment_status', 'payment_id', 'transaction_id',
                'payment_gateway', 'payment_signature'
            )
        }),
        ('Order Details', {
            'fields': (
                'id', 'user', 'vendor', 'total_amount',
                'status', 'created_at', 'updated_at'
            )
        })
    )

    def user_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'

    def payment_status_badge(self, obj):
        colors = {
            'PENDING': 'orange',
            'SUCCESS': 'green',
            'FAILED': 'red'
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            colors.get(obj.payment_status, 'black'),
            obj.get_payment_status_display()
        )
    payment_status_badge.short_description = 'Payment Status'

    def has_add_permission(self, request):
        return False  # Payments are created only through webhooks

    def has_delete_permission(self, request, obj=None):
        return False  # Prevent payment record deletion

    class Meta:
        verbose_name = 'Payment Record'
        verbose_name_plural = 'Payment Records'
