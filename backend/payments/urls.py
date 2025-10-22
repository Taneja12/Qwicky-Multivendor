# payments/urls.py
from django.urls import path
from .api import CreateCheckoutSessionAPIView, verify_payment
from .views import PaymentWebhookAPIView

app_name = 'payments'

urlpatterns = [
    path('webhook/', PaymentWebhookAPIView.as_view(), name='webhook'),
    path('checkout/', CreateCheckoutSessionAPIView.as_view(), name='checkout'),
    path('verify/', verify_payment, name='verify-payment'),
]