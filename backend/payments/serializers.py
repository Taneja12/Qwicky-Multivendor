from rest_framework import serializers
from orders.models import Order

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'id', 'payment_id', 'transaction_id', 'payment_gateway',
            'payment_status', 'payment_signature', 'status',
            'total_amount', 'created_at'
        ]
        read_only_fields = fields