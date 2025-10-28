from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .services import RecommendationEngine
from .models import UserRecommendation
from products.models import Product
from products.serializers import ProductSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    """Get personalized recommendations for the authenticated user"""
    try:
        limit = int(request.GET.get('limit', 10))
        refresh = request.GET.get('refresh', 'false').lower() == 'true'
        
        # Check for valid cached recommendations (not expired)
        valid_recommendations = UserRecommendation.objects.filter(
            user=request.user,
            expires_at__gt=timezone.now()
        ).select_related('product', 'product__vendor', 'product__category')[:limit]
        
        if valid_recommendations.exists() and not refresh:
            from .serializers import RecommendationSerializer
            serializer = RecommendationSerializer(valid_recommendations, many=True)
            return Response({
                'recommendations': [item['product'] for item in serializer.data],
                'source': 'cached',
                'count': len(serializer.data)
            })
        
        # Generate new recommendations
        recommendations = RecommendationEngine.generate_user_recommendations(request.user, limit)
        serializer = ProductSerializer(recommendations, many=True)
        return Response({
            'recommendations': serializer.data,
            'source': 'generated',
            'count': len(serializer.data)
        })
    
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        print(traceback.format_exc())  # This will show the full traceback
        
        # Fallback to trending products
        try:
            trending = RecommendationEngine.get_trending_products(limit)
            serializer = ProductSerializer(trending, many=True)
            return Response({
                'recommendations': serializer.data,
                'source': 'fallback_trending',
                'count': len(serializer.data),
                'error': str(e)
            }, status=status.HTTP_200_OK)
        except Exception as fallback_error:
            return Response({
                'recommendations': [],
                'error': f"Primary: {str(e)}, Fallback: {str(fallback_error)}"
            }, status=status.HTTP_200_OK)
            
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reorder_recommendations(request):
    """Get recommendations for reordering based on order history"""
    limit = int(request.GET.get('limit', 6))
    
    try:
        recommendations = RecommendationEngine.get_order_based_recommendations(request.user, limit)
        serializer = ProductSerializer(recommendations, many=True)
        return Response({
            'recommendations': serializer.data,
            'count': len(serializer.data)
        })
    except Exception as e:
        return Response({
            'recommendations': [],
            'error': str(e)
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quick_reorder(request):
    """Get quick reorder options - frequently ordered items"""
    from orders.models import OrderItem
    from django.db.models import Count, Sum, Max
    
    try:
        frequent_items = OrderItem.objects.filter(
            order__user=request.user,
            order__status='COMPLETED'
        ).values('product').annotate(
            total_orders=Count('order', distinct=True),
            total_quantity=Sum('quantity'),
            last_ordered=Max('order__created_at')
        ).order_by('-total_orders', '-last_ordered')[:8]
        
        product_ids = [item['product'] for item in frequent_items]
        products = Product.objects.filter(
            id__in=product_ids, 
            is_available=True
        ).select_related('vendor', 'category')
        
        serializer = ProductSerializer(products, many=True)
        return Response({
            'quick_reorder': serializer.data,
            'count': len(serializer.data)
        })
    except Exception as e:
        return Response({
            'quick_reorder': [],
            'error': str(e)
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_trending(request):
    """Get trending products (public endpoint)"""
    limit = int(request.GET.get('limit', 10))
    
    try:
        trending = RecommendationEngine.get_trending_products(limit)
        serializer = ProductSerializer(trending, many=True)
        return Response({
            'products': serializer.data,
            'count': len(serializer.data)
        })
    except Exception as e:
        return Response({
            'products': [],
            'error': str(e)
        }, status=status.HTTP_200_OK)