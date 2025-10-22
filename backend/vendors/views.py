from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Canteen, VendorProfile
from .serializers import CanteenSerializer, VendorProfileSerializer


class CanteenViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Canteen.objects.filter(is_active=True).order_by('name')
    serializer_class = CanteenSerializer
    permission_classes = [AllowAny]


class VendorProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VendorProfile.objects.select_related('canteen').all()
    serializer_class = VendorProfileSerializer
    permission_classes = [AllowAny]
from django.shortcuts import render

# Create your views here.
