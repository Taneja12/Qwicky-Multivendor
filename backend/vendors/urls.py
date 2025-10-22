from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CanteenViewSet, VendorProfileViewSet

router = DefaultRouter()
router.register(r'canteens', CanteenViewSet, basename='canteen')
router.register(r'vendors', VendorProfileViewSet, basename='vendor')

urlpatterns = [
    path('', include(router.urls)),
]
