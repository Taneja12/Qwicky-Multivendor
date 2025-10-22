from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from django.shortcuts import get_object_or_404
from products.models import Product
from django.db import transaction


class CartViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    def get_queryset(self):
        # Return carts for the authenticated user
        return Cart.objects.filter(user=self.request.user).select_related('canteen').prefetch_related('items__product')

    def create(self, request, *args, **kwargs):
        # Create or return existing cart for user+canteen
        canteen_id = request.data.get('canteen')
        if not canteen_id:
            return Response({'detail': 'canteen is required'}, status=status.HTTP_400_BAD_REQUEST)
        cart, created = Cart.objects.get_or_create(user=request.user, canteen_id=canteen_id)
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='clear')
    def clear(self, request, pk=None):
        cart = self.get_object()
        cart.items.all().delete()
        return Response({'detail': 'cart cleared'})


class CartItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user).select_related('product', 'cart')

    def perform_create(self, serializer):
        # Ensure the cart belongs to user and belongs to same canteen as the product
        cart_id = self.request.data.get('cart')
        product_id = self.request.data.get('product_id')
        cart = get_object_or_404(Cart, pk=cart_id, user=self.request.user)
        product = get_object_or_404(Product, pk=product_id)
        if product.vendor.canteen_id != cart.canteen_id:
            raise serializers.ValidationError('Product does not belong to the cart\'s canteen')
        # Merge duplicate items: if same product & same customizations exist, increase quantity
        with transaction.atomic():
            # Build a basic filter for identical items (product + same customization option ids)
            product = serializer.validated_data.get('product', product)
            quantity = serializer.validated_data.get('quantity', 1)
            # Naive matching: same product and no customizations
            if not self.request.data.get('customizations'):
                existing = CartItem.objects.filter(cart=cart, product=product).first()
                if existing:
                    existing.quantity = existing.quantity + quantity
                    existing.save()
                    # Attach serializer.instance to existing for consistency
                    serializer.instance = existing
                    return existing
            # Fallback: create new item
            serializer.save(cart=cart)
