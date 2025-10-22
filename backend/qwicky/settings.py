import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# Production allowed hosts - replace with your actual domain
ALLOWED_HOSTS = [
    'qwicky-multivendor.vercel.app',
    'www.yourdomain.com',
    'qwicky-multivendor.onrender.com',  # If using Heroku
    'your-app.render.com',     # If using Render
    'localhost',               # For local development
    '127.0.0.1',              # For local development
]

# Add this to get allowed hosts from environment variable
if os.getenv('ALLOWED_HOSTS'):
    ALLOWED_HOSTS.extend(os.getenv('ALLOWED_HOSTS').split(','))

# Production security settings

SECURE_SSL_REDIRECT = False  # Redirect HTTP to HTTPS in production
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# Ensure SECRET_KEY is strong in production
if not DEBUG:
    if not SECRET_KEY or SECRET_KEY.startswith('django-insecure-') or len(SECRET_KEY) < 50:
        raise RuntimeError('In production you must set a strong SECRET_KEY (>=50 chars) in your environment')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',  # This must be included for admin CSS
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'users',
    'vendors',
    'products',
    'cart',
    'orders',
    'payments',
    'corsheaders',
    'cloudinary',
    'cloudinary_storage',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this for static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS configuration for production
CORS_ALLOWED_ORIGINS = [
    'https://qwicky-multivendor.vercel.app',
    'https://www.yourdomain.com',
    'http://localhost:3000',  # For local development
    'http://127.0.0.1:3000',  # For local development
]

# Add environment-based CORS origins
if os.getenv('CORS_ALLOWED_ORIGINS'):
    CORS_ALLOWED_ORIGINS.extend(os.getenv('CORS_ALLOWED_ORIGINS').split(','))

CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'qwicky.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'qwicky.wsgi.application'

# Database configuration
import dj_database_url

# Use Neon DB in production, fallback to local for development

DATABASES = {
    'default': dj_database_url.config(default=os.getenv('DATABASE_URL'),   conn_max_age=600, ssl_require=True    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files configuration for Django Admin
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Add this to collect static files from Django apps
STATICFILES_DIRS = [
    BASE_DIR / 'static',  # If you have custom static files
]

# WhiteNoise configuration for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary configuration for production
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
    'SECURE': True,  # Use HTTPS
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT settings
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Stripe Settings
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

# Frontend URL for redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Payment webhook settings
PAYMENT_WEBHOOK_SECRET = os.getenv('PAYMENT_WEBHOOK_SECRET', 'your-webhook-secret-key')
AUTH_USER_MODEL = 'users.User'