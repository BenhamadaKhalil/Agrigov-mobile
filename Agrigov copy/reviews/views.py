from django.shortcuts import render
from rest_framework import viewsets
from .models import Review
from .serializer import ReviewSerializer
from rest_framework.permissions import IsAuthenticated

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Review.objects.select_related(
            "product",
            "product__farm",
            "product__ministry_product"
        ).prefetch_related(
            "product__images"
        )

class BuyerReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        buyer_profile = getattr(self.request.user, 'buyer_profile', None)
        if buyer_profile:
            return Review.objects.filter(buyer=buyer_profile)
        return Review.objects.none()