from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, SecureFileServeView

router = DefaultRouter()
router.register(r"files", FileViewSet, basename="files")

urlpatterns = [
    path("", include(router.urls)),

    # Secure file serve endpoint — token-based,
    # GET /api/v1/files/resources/<token>/
    path("resources/<str:token>/", SecureFileServeView.as_view(), name="secure-file-serve"),
]
