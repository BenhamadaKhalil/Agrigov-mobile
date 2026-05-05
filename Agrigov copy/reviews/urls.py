from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, BuyerReviewViewSet

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'my-reviews', BuyerReviewViewSet, basename='my-review')

urlpatterns = router.urls