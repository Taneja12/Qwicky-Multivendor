from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserSerializer, RegisterSerializer
from .models import User

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from .services import BehaviorTrackingService



class RegisterAPIView(generics.CreateAPIView):
	"""Register a new user. We accept email and password (username is generated)."""
	serializer_class = RegisterSerializer
	permission_classes = [permissions.AllowAny]

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()

		# Create JWT tokens for the new user
		refresh = RefreshToken.for_user(user)

		data = {
			'user': UserSerializer(user, context={'request': request}).data,
			'access': str(refresh.access_token),
			'refresh': str(refresh),
		}
		return Response(data, status=status.HTTP_201_CREATED)


class ProfileAPIView(generics.RetrieveUpdateAPIView):
	"""Retrieve or update authenticated user's profile."""
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]

	def get_object(self):
		return self.request.user


class LogoutAPIView(APIView):
	"""Logout by blacklisting refresh token (if blacklist app is enabled).

	Client should POST: { "refresh": "<refresh_token>" }
	"""
	permission_classes = [IsAuthenticated]

	def post(self, request, *args, **kwargs):
		refresh_token = request.data.get('refresh')
		if not refresh_token:
			return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			token = RefreshToken(refresh_token)
			# If blacklist app is enabled this will blacklist the token
			token.blacklist()
		except Exception:
			# If blacklist not enabled, just return success so client can drop tokens
			return Response({'detail': 'Token could not be blacklisted (blacklist app may be disabled).'}, status=status.HTTP_200_OK)

		return Response(status=status.HTTP_205_RESET_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_behavior(request):
    """API endpoint to track user behavior"""
    action_type = request.data.get('type')
    product_id = request.data.get('productId')
    vendor_id = request.data.get('vendorId')
    category_id = request.data.get('categoryId')
    search_query = request.data.get('searchQuery')
    
    product = None
    if product_id:
        from products.models import Product
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            pass
    
    vendor = None
    if vendor_id:
        from vendors.models import VendorProfile
        try:
            vendor = VendorProfile.objects.get(id=vendor_id)
        except VendorProfile.DoesNotExist:
            pass
    
    category = None
    if category_id:
        from products.models import Category
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            pass
    
    BehaviorTrackingService.track_user_behavior(
        user=request.user,
        action_type=action_type,
        product=product,
        vendor=vendor,
        category=category,
        search_query=search_query
    )
    
    return Response({'status': 'tracked'})