from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, CustomizationOption

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']

class CustomizationOptionInline(admin.TabularInline):
    model = CustomizationOption
    extra = 1
    fields = ['name', 'price_addition', 'is_available']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['thumbnail', 'name', 'vendor', 'category', 'price', 'is_available', 'is_veg', 'preparation_time']
    list_filter = ['is_available', 'is_veg', 'category', 'vendor']
    search_fields = ['name', 'description', 'vendor__business_name']
    raw_id_fields = ['vendor']
    inlines = [CustomizationOptionInline]
    readonly_fields = ['image_preview']
    
    def thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width:72px; height:48px; object-fit:cover; border-radius:4px;" />', obj.image.url)
        return '-'
    thumbnail.short_description = 'Image'

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-width:320px; height:auto; object-fit:cover;" />', obj.image.url)
        return 'No image'
    image_preview.short_description = 'Preview'
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'price', 'image')
        }),
        ('Classification', {
            'fields': ('vendor', 'category')
        }),
        ('Availability', {
            'fields': ('is_available', 'is_veg', 'preparation_time')
        })
    )

@admin.register(CustomizationOption)
class CustomizationOptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'product', 'price_addition', 'is_available']
    list_filter = ['is_available', 'product__vendor']
    search_fields = ['name', 'product__name']
    raw_id_fields = ['product']
