from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_recommendations, name='user-recommendations'),
    path('reorder/', views.get_reorder_recommendations, name='reorder-recommendations'),
    path('quick-reorder/', views.get_quick_reorder, name='quick-reorder'),
    path('trending/', views.get_trending, name='trending-products'),
]