from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings
import requests
from .models import User

class ClerkAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # Get the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        # Check if it's a Bearer token
        try:
            auth_type, token = auth_header.split(' ')
            if auth_type.lower() != 'bearer':
                return None
        except ValueError:
            return None

        # Verify the token with Clerk
        try:
            headers = {
                'Authorization': f'Bearer {settings.CLERK_SECRET_KEY}',
                'Content-Type': 'application/json',
            }
            response = requests.get(
                f'{settings.CLERK_API_URL}/sessions/{token}',
                headers=headers
            )
            
            if response.status_code != 200:
                raise exceptions.AuthenticationFailed('Invalid token')

            session_data = response.json()
            user_id = session_data.get('user_id')
            
            # Get or create user in your database
            user, created = User.objects.get_or_create(
                clerk_id=user_id,
                defaults={
                    'email': session_data.get('email', ''),
                    'is_active': True
                }
            )
            
            return (user, None)
        except Exception as e:
            raise exceptions.AuthenticationFailed('Invalid token')