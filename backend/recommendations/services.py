from django.db.models import Count, Q, Sum, Max
from collections import Counter
from users.models import UserBehavior
from products.models import Product
from orders.models import Order, OrderItem
from vendors.models import VendorProfile
from django.utils import timezone  # Add this import
import math
from datetime import timedelta

class RecommendationEngine:
    @staticmethod
    def get_order_based_recommendations(user, limit=10):
        """Recommendations based on user's order history"""
        try:
            # Get user's completed orders
            user_orders = Order.objects.filter(
                user=user,
                status='COMPLETED'
            ).prefetch_related('items__product')
            
            if not user_orders:
                return []
            
            # Analyze order patterns
            purchased_products = Counter()
            preferred_categories = Counter()
            preferred_vendors = Counter()
            
            for order in user_orders:
                for item in order.items.all():
                    # Weight by quantity and recency - FIXED: use timezone-aware now
                    days_ago = (timezone.now().date() - order.created_at.date()).days
                    recency_weight = max(0.1, 1 - (days_ago / 90))
                    
                    purchased_products[item.product.id] += item.quantity * recency_weight
                    
                    if item.product.category:
                        preferred_categories[item.product.category.id] += item.quantity * recency_weight
                    if item.product.vendor:
                        preferred_vendors[item.product.vendor.id] += item.quantity * recency_weight
            
            # Generate recommendations
            top_categories = [cat_id for cat_id, _ in preferred_categories.most_common(2)]
            top_vendors = [vendor_id for vendor_id, _ in preferred_vendors.most_common(2)]
            
            similar_products = Product.objects.filter(
                Q(category_id__in=top_categories) | Q(vendor_id__in=top_vendors),
                is_available=True
            ).exclude(id__in=purchased_products.keys()).distinct()[:limit]
            
            return list(similar_products)
        
        except Exception as e:
            print(f"Error in order-based recommendations: {e}")
            return []

    @staticmethod
    def get_behavior_based_recommendations(user, limit=10):
        """Use your existing UserBehavior model for recommendations"""
        try:
            # Get recent user behaviors - FIXED: use timezone-aware datetime
            recent_behaviors = UserBehavior.objects.filter(
                user=user,
                timestamp__gte=timezone.now() - timedelta(days=30)
            )
            
            # Analyze behavior patterns
            viewed_products = Counter()
            added_to_cart = Counter()
            
            for behavior in recent_behaviors:
                if behavior.product:
                    weight = {
                        'VIEW_PRODUCT': 1,
                        'ADD_TO_CART': 3,
                        'PURCHASE': 5
                    }.get(behavior.action_type, 1)
                    
                    if behavior.action_type == 'VIEW_PRODUCT':
                        viewed_products[behavior.product.id] += weight
                    elif behavior.action_type == 'ADD_TO_CART':
                        added_to_cart[behavior.product.id] += weight
            
            # Get products user interacted with but didn't purchase
            interacted_products = set(viewed_products.keys()) | set(added_to_cart.keys())
            
            if not interacted_products:
                return []
            
            # Find similar products using your existing get_similar_products method
            recommendations = []
            for product_id in list(interacted_products)[:5]:
                try:
                    product = Product.objects.get(id=product_id)
                    similar = product.get_similar_products(limit=2)
                    recommendations.extend(similar)
                except Product.DoesNotExist:
                    continue
            
            # Remove duplicates and return
            seen = set()
            unique_recommendations = []
            for product in recommendations:
                if product.id not in seen and product.id not in interacted_products:
                    unique_recommendations.append(product)
                    seen.add(product.id)
            
            return unique_recommendations[:limit]
        
        except Exception as e:
            print(f"Error in behavior-based recommendations: {e}")
            return []

    @staticmethod
    def get_trending_products(limit=10):
        """Get currently popular products using your existing models"""
        try:
            trending = Product.objects.filter(
                is_available=True
            ).annotate(
                order_count=Count('orderitem')
            ).order_by('-order_count')[:limit]
            
            return trending
        except Exception as e:
            print(f"Error in trending products: {e}")
            return []

    @staticmethod
    def generate_user_recommendations(user, limit=10):
        """Generate comprehensive recommendations using all data sources"""
        from .models import UserRecommendation
        
        try:
            # Clear existing recommendations
            UserRecommendation.objects.filter(user=user).delete()
            
            recommendations = []
            seen_products = set()
            
            # 1. Order-based recommendations (highest priority)
            order_based = RecommendationEngine.get_order_based_recommendations(user, limit//2)
            for product in order_based:
                if product.id not in seen_products:
                    recommendations.append((product, 1.0, 'order_based'))
                    seen_products.add(product.id)
            
            # 2. Behavior-based recommendations
            if len(recommendations) < limit:
                behavior_based = RecommendationEngine.get_behavior_based_recommendations(
                    user, limit - len(recommendations)
                )
                for product in behavior_based:
                    if product.id not in seen_products:
                        recommendations.append((product, 0.8, 'behavior_based'))
                        seen_products.add(product.id)
            
            # 3. Trending as fallback
            if len(recommendations) < limit:
                trending = RecommendationEngine.get_trending_products(limit - len(recommendations))
                for product in trending:
                    if product.id not in seen_products:
                        recommendations.append((product, 0.5, 'trending'))
                        seen_products.add(product.id)
            
            # Store recommendations
            for product, score, algorithm in recommendations[:limit]:
                UserRecommendation.objects.create(
                    user=user,
                    product=product,
                    score=score,
                    algorithm=algorithm
                )
            
            return [rec[0] for rec in recommendations[:limit]]
        
        except Exception as e:
            print(f"Error generating user recommendations: {e}")
            return []