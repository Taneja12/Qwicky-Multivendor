from rest_framework import serializers
from products.models import Product
from .models import UserRecommendation

class ProductRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for product recommendations"""
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()  # Add this method field
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'image_url',  # Use image_url instead of image
            'is_available', 'is_veg', 'preparation_time',
            'vendor_name', 'category_name'
        ]
    
    def get_image_url(self, obj):
        """Get the image URL from Cloudinary field"""
        if obj.image:
            return obj.image.url
        return None

class RecommendationSerializer(serializers.ModelSerializer):
    """Serializer for user recommendations"""
    product = ProductRecommendationSerializer(read_only=True)
    
    class Meta:
        model = UserRecommendation
        fields = ['product', 'score', 'algorithm', 'created_at']