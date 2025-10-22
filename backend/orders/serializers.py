from rest_framework import serializers
from .models import Order, OrderItem, OrderItemCustomization
from vendors.serializers import VendorProfileSerializer  # Import your existing vendor serializer
from products.serializers import ProductSerializer  # Import your existing product serializer

class OrderItemCustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItemCustomization
        fields = ['option', 'name_at_time', 'price_at_time']
        read_only_fields = ['name_at_time', 'price_at_time']

class OrderItemSerializer(serializers.ModelSerializer):
    customizations = OrderItemCustomizationSerializer(many=True, required=False, read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, 
        read_only=True, source='get_total_price'
    )
    product_details = ProductSerializer(source='product', read_only=True)  # Use your existing product serializer

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_details', 'quantity', 'unit_price',
            'note', 'customizations', 'total_price'
        ]
        read_only_fields = ['unit_price']

    def create(self, validated_data):
        customizations_data = validated_data.pop('customizations', [])
        order_item = OrderItem.objects.create(**validated_data)
        
        # Create customizations and set prices at time of order
        for custom_data in customizations_data:
            option = custom_data['option']
            OrderItemCustomization.objects.create(
                order_item=order_item,
                option=option,
                name_at_time=option.name,
                price_at_time=option.price_addition
            )
        
        return order_item

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    vendor_details = VendorProfileSerializer(source='vendor', read_only=True)  # Use your existing vendor serializer

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'vendor', 'vendor_details', 'status', 'status_display',
            'total_amount', 'pickup_time', 'note', 'items',
            'payment_id', 'transaction_id', 'payment_gateway',
            'payment_status', 'payment_status_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'payment_id', 'transaction_id', 'payment_gateway',
            'payment_status', 'payment_signature', 'created_at', 'updated_at'
        ]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("At least one item is required.")
        return items

    def validate(self, attrs):
        # Ensure all items are from the same vendor
        items_data = attrs.get('items', [])
        if items_data:
            vendor = attrs.get('vendor')
            for item_data in items_data:
                if item_data['product'].vendor != vendor:
                    raise serializers.ValidationError({
                        "items": "All items must be from the same vendor."
                    })
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # Set initial status to PENDING_PAYMENT
        validated_data['status'] = Order.Status.PENDING_PAYMENT
        validated_data['total_amount'] = 0  # Set default to avoid IntegrityError
        order = Order.objects.create(**validated_data)

        # Create order items with current prices
        for item_data in items_data:
            customizations = item_data.pop('customizations', [])
            product = item_data['product']
            # Set price at time of order
            item_data['unit_price'] = product.price
            item = OrderItem.objects.create(order=order, **item_data)
            
            # Create customizations with current prices
            for custom_data in customizations:
                option = custom_data['option']
                OrderItemCustomization.objects.create(
                    order_item=item,
                    option=option,
                    name_at_time=option.name,
                    price_at_time=option.price_addition
                )

        # Calculate and set total amount
        total = sum(item.get_total_price() for item in order.items.all())
        order.total_amount = total
        order.save()

        return order