from django.apps import AppConfig

class RecommendationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'recommendations'
    verbose_name = 'Recommendations'
    
    def ready(self):
        # Import signals if you add them later
        try:
            import recommendations.signals
        except ImportError:
            pass