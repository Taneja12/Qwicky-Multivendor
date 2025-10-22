from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('webhook/', views.PaymentWebhookAPIView.as_view(), name='webhook'),
]