from rest_framework import serializers
from .models import Category, Product, CustomizationOption


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class CustomizationOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizationOption
        fields = ['id', 'name', 'price_addition', 'is_available']


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    customization_options = CustomizationOptionSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'category', 'name', 'description', 'price', 'image', 'image_url',
            'is_available', 'is_veg', 'preparation_time', 'customization_options'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
