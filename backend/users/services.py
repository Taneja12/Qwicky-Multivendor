from .models import UserBehavior

class BehaviorTrackingService:
    @staticmethod
    def track_user_behavior(user, action_type, product=None, vendor=None, category=None, search_query=None):
        """Track user behavior using your existing UserBehavior model"""
        UserBehavior.objects.create(
            user=user,
            action_type=action_type,
            product=product,
            vendor=vendor,
            category=category,
            search_query=search_query
        )
    
    @staticmethod
    def track_product_view(user, product):
        BehaviorTrackingService.track_user_behavior(
            user=user,
            action_type='VIEW_PRODUCT',
            product=product
        )
    
    @staticmethod
    def track_add_to_cart(user, product):
        BehaviorTrackingService.track_user_behavior(
            user=user,
            action_type='ADD_TO_CART',
            product=product
        )
    
    @staticmethod
    def track_purchase(user, products):
        for product in products:
            BehaviorTrackingService.track_user_behavior(
                user=user,
                action_type='PURCHASE',
                product=product
            )
    
    @staticmethod
    def track_vendor_view(user, vendor):
        BehaviorTrackingService.track_user_behavior(
            user=user,
            action_type='VIEW_VENDOR',
            vendor=vendor
        )
    
    @staticmethod
    def track_search(user, search_query):
        BehaviorTrackingService.track_user_behavior(
            user=user,
            action_type='SEARCH',
            search_query=search_query
        )