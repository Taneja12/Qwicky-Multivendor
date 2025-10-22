from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    path('', views.OrderListCreateAPIView.as_view(), name='order-list-create'),
    path('<int:pk>/', views.OrderDetailAPIView.as_view(), name='order-detail'),
]