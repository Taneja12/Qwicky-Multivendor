from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserSerializer, RegisterSerializer
from .models import User

from rest_framework_simplejwt.tokens import RefreshToken


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

