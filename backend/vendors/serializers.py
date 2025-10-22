from rest_framework import serializers
from .models import Canteen, VendorProfile


class CanteenSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Canteen
        fields = ['id', 'name', 'location', 'description', 'is_active', 'image', 'image_url']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class VendorProfileSerializer(serializers.ModelSerializer):
    canteen = CanteenSerializer(read_only=True)

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'user', 'business_name', 'canteen', 'description', 'is_open',
            'avg_preparation_time', 'opening_time', 'closing_time'
        ]
