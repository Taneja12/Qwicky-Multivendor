from django.contrib import admin
from .models import Canteen, VendorProfile
from django.utils.html import format_html


class VendorProfileInline(admin.TabularInline):
    model = VendorProfile
    extra = 1
    fields = ('user', 'business_name', 'is_open', 'avg_preparation_time')
    raw_id_fields = ('user',)

@admin.register(Canteen)
class CanteenAdmin(admin.ModelAdmin):
    list_display = ['thumbnail', 'name', 'location', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'location', 'description']
    ordering = ['name']
    inlines = [VendorProfileInline]

    readonly_fields = ['image_preview']

    def thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width:64px; height:40px; object-fit:cover; border-radius:4px;" />', obj.image.url)
        return '-'
    thumbnail.short_description = 'Image'

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-width:480px; height:auto; object-fit:cover;" />', obj.image.url)
        return 'No image'
    image_preview.short_description = 'Preview'

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'canteen', 'user', 'is_open', 'avg_preparation_time']
    list_filter = ['is_open', 'canteen', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    search_fields = ['business_name', 'description', 'user__email']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'canteen', 'business_name', 'description')
        }),
        ('Timing', {
            'fields': (('opening_time', 'closing_time'), 'avg_preparation_time')
        }),
        ('Operating Days', {
            'fields': (('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),)
        }),
        ('Status', {
            'fields': ('is_open',)
        })
    )
