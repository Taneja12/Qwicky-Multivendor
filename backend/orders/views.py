from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Order
from .serializers import OrderSerializer

class OrderPermission(permissions.BasePermission):
    """Custom permission to only allow owners of an order to view or edit it."""

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class OrderListCreateAPIView(generics.ListCreateAPIView):
    """
    List all orders for the authenticated user or create a new order.
    
    GET:
        Returns a list of all orders placed by the authenticated user.
        Orders are sorted by creation date (newest first).
    
    POST:
        Create a new order with items from a single vendor.
        The order starts in PENDING_PAYMENT status.
        
        Required fields:
        - vendor: ID of the vendor
        - items: Array of items with product, quantity, and optional customizations
        
        Optional fields:
        - pickup_time: Desired pickup time (datetime)
        - note: Additional instructions
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return orders for the authenticated user only."""
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        """Set the authenticated user before saving the order."""
        serializer.save(user=self.request.user)

class OrderDetailAPIView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific order.
    
    GET:
        Returns detailed information about a specific order.
        Only accessible by the order owner.
    
    PATCH:
        Update specific fields of an order.
        Only status can be updated, and only by the order owner.
        Valid status transitions depend on current status and payment status.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, OrderPermission]
    queryset = Order.objects.all()

    def get_object(self):
        """
        Retrieve and return the order instance.
        Raises 404 if not found or 403 if user doesn't own the order.
        """
        obj = super().get_object()
        if obj.user != self.request.user:
            raise PermissionDenied("You do not have permission to access this order.")
        return obj

    def perform_update(self, serializer):
        """
        Handle order updates with status validation.
        Only allows specific status transitions based on current state.
        """
        instance = serializer.instance
        new_status = serializer.validated_data.get('status')

        # If status is being updated, validate the transition
        if new_status and new_status != instance.status:
            # Only allow cancellation if order is not yet prepared
            if new_status == Order.Status.CANCELLED:
                if instance.status in [Order.Status.PREPARING, Order.Status.READY, Order.Status.COMPLETED]:
                    raise serializer.ValidationError({
                        "status": "Cannot cancel an order that is being prepared or completed."
                    })
            
            # Prevent status changes if payment hasn't been completed
            elif instance.payment_status != Order.PaymentStatus.SUCCESS:
                raise serializer.ValidationError({
                    "status": "Cannot update status until payment is completed."
                })

            # Prevent invalid status transitions
            if instance.status == Order.Status.CANCELLED:
                raise serializer.ValidationError({
                    "status": "Cannot modify a cancelled order."
                })
            elif instance.status == Order.Status.COMPLETED:
                raise serializer.ValidationError({
                    "status": "Cannot modify a completed order."
                })

        serializer.save()
