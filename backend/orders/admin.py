from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem, OrderItemCustomization

class OrderItemCustomizationInline(admin.TabularInline):
    model = OrderItemCustomization
    extra = 0
    readonly_fields = ['name_at_time', 'price_at_time']
    can_delete = False
    max_num = 0

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'unit_price', 'get_total_price']
    can_delete = False
    max_num = 0
    inlines = [OrderItemCustomizationInline]
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'vendor', 'status_badge', 'payment_status_badge', 
                   'total_amount', 'created_at']
    list_filter = ['status', 'payment_status', 'created_at', 'vendor']
    search_fields = ['id', 'user__email', 'vendor__business_name', 
                    'payment_id', 'transaction_id']
    readonly_fields = ['payment_id', 'transaction_id', 'payment_gateway', 
                      'payment_signature', 'created_at', 'updated_at']
    raw_id_fields = ['user', 'vendor']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'vendor', 'status', 'total_amount')
        }),
        ('Payment Information', {
            'fields': (
                'payment_status', 'payment_id', 'transaction_id',
                'payment_gateway', 'payment_signature'
            )
        }),
        ('Additional Information', {
            'fields': ('pickup_time', 'note')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def status_badge(self, obj):
        colors = {
            'PENDING_PAYMENT': 'orange',
            'PAYMENT_FAILED': 'red',
            'PAID': 'blue',
            'CONFIRMED': 'purple',
            'PREPARING': 'teal',
            'READY': 'green',
            'COMPLETED': 'gray',
            'CANCELLED': 'red'
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

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

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'product', 'quantity', 'unit_price', 'get_total_price']
    list_filter = ['order__status']
    search_fields = ['order__id', 'product__name']
    raw_id_fields = ['order', 'product']
    readonly_fields = ['unit_price', 'get_total_price']
    inlines = [OrderItemCustomizationInline]

@admin.register(OrderItemCustomization)
class OrderItemCustomizationAdmin(admin.ModelAdmin):
    list_display = ['id', 'order_item', 'name_at_time', 'price_at_time']
    search_fields = ['order_item__order__id', 'name_at_time']
    raw_id_fields = ['order_item', 'option']
    readonly_fields = ['name_at_time', 'price_at_time']
