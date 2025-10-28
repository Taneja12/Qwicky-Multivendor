from django.urls import path
from . import views
from django.http import HttpResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

def home(request):
    return HttpResponse("Hi")

urlpatterns = [
    path('', home),
    # JWT endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User endpoints
    path('register/', views.RegisterAPIView.as_view(), name='register'),
    path('profile/', views.ProfileAPIView.as_view(), name='profile'),
    path('logout/', views.LogoutAPIView.as_view(), name='logout'),

    path('behavior/', views.track_behavior, name='track-behavior'),
]
