from rest_framework import serializers
from .models import Cart, CartItem, CartItemCustomization
from products.serializers import ProductSerializer
from products.models import Product, CustomizationOption


class CartItemCustomizationSerializer(serializers.ModelSerializer):
    option_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CartItemCustomization
        fields = ['id', 'option_id']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    customizations = CartItemCustomizationSerializer(many=True, required=False)
    total_price = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product',
            'product_id',
            'quantity',
            'note',
            'customizations',
            'total_price',   # ✅ added missing field
            'created_at'
        ]

    def create(self, validated_data):
        customizations = validated_data.pop('customizations', [])
        product_id = validated_data.pop('product_id')
        product = Product.objects.get(pk=product_id)
        cart_item = CartItem.objects.create(product=product, **validated_data)
        for c in customizations:
            opt_id = c.get('option_id')
            try:
                opt = CustomizationOption.objects.get(pk=opt_id)
                CartItemCustomization.objects.create(cart_item=cart_item, option=opt)
            except CustomizationOption.DoesNotExist:
                continue
        return cart_item

    def get_total_price(self, obj):
        base_price = float(getattr(obj.product, "price", 0))
        customizations_price = sum(
            (c.option.price_addition or 0) for c in obj.customizations.all()
        )
        return round((base_price + customizations_price) * obj.quantity, 2)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    canteen = serializers.PrimaryKeyRelatedField(read_only=True)
    total_price = serializers.SerializerMethodField(read_only=True)
    item_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Cart
        fields = [
            'id',
            'user',
            'canteen',
            'items',
            'total_price',   # ✅ present
            'item_count',    # ✅ added
            'created_at',
            'updated_at'
        ]

    def get_total_price(self, obj):
        total = 0
        for it in obj.items.all():
            price = float(it.product.price)
            custom_total = sum((c.option.price_addition or 0) for c in it.customizations.all())
            total += (price + custom_total) * it.quantity
        return round(total, 2)

    def get_item_count(self, obj):
        return sum(it.quantity for it in obj.items.all())
