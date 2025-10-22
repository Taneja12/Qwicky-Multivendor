from django.contrib import admin
from .models import Cart, CartItem, CartItemCustomization

class CartItemCustomizationInline(admin.TabularInline):
    model = CartItemCustomization
    extra = 1
    raw_id_fields = ['option']

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1
    raw_id_fields = ['product']
    show_change_link = True
    readonly_fields = ['get_total_price']
    fields = ['product', 'quantity', 'note', 'get_total_price']

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_total_price', 'item_count', 'updated_at']
    search_fields = ['user__email', 'user__username']
    raw_id_fields = ['user']
    inlines = [CartItemInline]
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Number of Items'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'cart', 'product', 'quantity', 'get_total_price', 'created_at']
    list_filter = ['created_at']
    search_fields = ['cart__user__email', 'product__name']
    raw_id_fields = ['cart', 'product']
    inlines = [CartItemCustomizationInline]
    readonly_fields = ['get_total_price']

@admin.register(CartItemCustomization)
class CartItemCustomizationAdmin(admin.ModelAdmin):
    list_display = ['cart_item', 'option']
    raw_id_fields = ['cart_item', 'option']
    search_fields = ['cart_item__product__name', 'option__name']
