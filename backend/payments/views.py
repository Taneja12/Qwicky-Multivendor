import hmac
import hashlib
import logging
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.db import transaction
from orders.models import Order
from .serializers import PaymentSerializer

logger = logging.getLogger(__name__)

class PaymentWebhookAPIView(APIView):
    """
    Payment Gateway Webhook Endpoint.
    
    Handles asynchronous payment status updates from payment gateways.
    Verifies webhook signatures and updates order payment status.
    
    Expected payload:
    {
        "order_id": "123",
        "payment_id": "pay_xyz789",
        "transaction_id": "txn_abc123",
        "status": "SUCCESS",
        "gateway": "RAZORPAY",
        "signature": "calculated-hmac-signature"
    }
    """
    permission_classes = [permissions.AllowAny]
    
    def verify_signature(self, data, signature):
        """
        Verify webhook signature using HMAC-SHA256.
        Override this method to implement gateway-specific verification.
        """
        try:
            secret_key = settings.PAYMENT_WEBHOOK_SECRET
            # Create a consistent string to sign (sorted keys to ensure consistency)
            sign_string = '|'.join(str(data[k]) for k in sorted(['order_id', 'payment_id', 'status']))
            expected = hmac.new(
                secret_key.encode(),
                sign_string.encode(),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(signature, expected)
        except Exception as e:
            logger.error(f"Signature verification error: {str(e)}")
            return False

    @transaction.atomic
    def update_order_payment(self, order, data):
        """
        Update order payment details atomically.
        Returns tuple of (success, message).
        """
        try:
            # Prevent double-processing of successful payments
            if order.payment_status == Order.PaymentStatus.SUCCESS:
                return True, "Payment already processed"

            # Update payment information
            order.payment_id = data['payment_id']
            order.transaction_id = data['transaction_id']
            order.payment_gateway = data.get('gateway', 'UNKNOWN')
            order.payment_signature = data['signature']
            
            # Update status based on payment result
            payment_status = data.get('status', '').upper()
            if payment_status == 'SUCCESS':
                order.payment_status = Order.PaymentStatus.SUCCESS
                order.status = Order.Status.PAID
            else:
                order.payment_status = Order.PaymentStatus.FAILED
                order.status = Order.Status.PAYMENT_FAILED

            order.save()
            return True, "Payment processed successfully"
            
        except Exception as e:
            logger.error(f"Order update error: {str(e)}")
            return False, str(e)
    
    def post(self, request, *args, **kwargs):
        """Handle payment gateway webhook POST requests."""
        # Log webhook payload (exclude sensitive data)
        safe_data = {**request.data}
        safe_data.pop('signature', None)
        logger.info(f"Received webhook payload: {safe_data}")
        
        try:
            # Validate required fields
            required_fields = ['order_id', 'payment_id', 'transaction_id', 'signature', 'status']
            missing = [f for f in required_fields if not request.data.get(f)]
            if missing:
                return Response({
                    "success": False,
                    "error": f"Missing required fields: {', '.join(missing)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verify signature
            if not self.verify_signature(request.data, request.data['signature']):
                logger.warning(f"Invalid signature for order {request.data.get('order_id')}")
                return Response({
                    "success": False,
                    "error": "Invalid signature"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get order
            try:
                order = Order.objects.get(id=request.data['order_id'])
            except Order.DoesNotExist:
                logger.error(f"Order {request.data.get('order_id')} not found")
                return Response({
                    "success": False,
                    "error": "Order not found"
                }, status=status.HTTP_404_NOT_FOUND)

            # Update order payment status
            success, message = self.update_order_payment(order, request.data)
            if not success:
                return Response({
                    "success": False,
                    "error": message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Return updated order data
            serializer = PaymentSerializer(order)
            return Response({
                "success": True,
                "data": serializer.data,
                "message": message
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Webhook processing error")
            return Response({
                "success": False,
                "error": "Internal server error",
                "detail": str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
