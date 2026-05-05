from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Product, MinistryProduct
from .serializers import (
    ProductSerializer,
    CreateProductSerializer,
    UpdateProductSerializer,
    MinistryProductSerializer,
    MinistryProductWriteSerializer,
)
from .filters import ProductFilter
from .permissions import IsFarmerOwner, IsAdmin


# ═══════════════════════════════════════════════
#  MinistryProduct views  (admin only for write)
# ═══════════════════════════════════════════════

class MinistryProductListView(generics.ListAPIView):
    """
    GET /products/ministry/
    Any authenticated user can browse the official product catalogue.
    Farmers use this to pick which product they want to sell.
    """
    queryset = MinistryProduct.objects.filter(is_active=True).select_related("category")
    serializer_class = MinistryProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category__name"]


class MinistryProductDetailView(generics.RetrieveAPIView):
    """GET /products/ministry/<pk>/"""
    queryset = MinistryProduct.objects.filter(is_active=True)
    serializer_class = MinistryProductSerializer
    permission_classes = [permissions.IsAuthenticated]


class MinistryProductCreateView(generics.CreateAPIView):
    """POST /products/ministry/create/  — admin only"""
    queryset = MinistryProduct.objects.all()
    serializer_class = MinistryProductWriteSerializer
    permission_classes = [IsAdmin]


class MinistryProductUpdateView(generics.RetrieveUpdateAPIView):
    """GET/PUT/PATCH /products/ministry/<pk>/update/  — admin only"""
    queryset = MinistryProduct.objects.all()
    serializer_class = MinistryProductWriteSerializer
    permission_classes = [IsAdmin]


class MinistryProductDeleteView(generics.DestroyAPIView):
    """
    DELETE /products/ministry/<pk>/delete/  — admin only
    Soft-delete: sets is_active=False instead of hard deleting,
    so existing farmer listings (PROTECT) are never broken.
    """
    queryset = MinistryProduct.objects.all()
    permission_classes = [IsAdmin]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


# ═══════════════════════════════════════════════
#  Product views  (farmer listings)
# ═══════════════════════════════════════════════

class ProductListView(generics.ListAPIView):
    """GET /products/"""
    queryset = (
        Product.objects.all()
        .select_related("farm", "farm__farmer", "category", "ministry_product")
        .prefetch_related("images")
    )
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["ministry_product__name", "description", "category__name"]
    ordering_fields = ["unit_price", "created_at", "average_rating", "stock"]


class ProductDetailView(generics.RetrieveAPIView):
    """GET /products/<pk>/"""
    queryset = (
        Product.objects.all()
        .select_related("ministry_product", "farm", "category")
        .prefetch_related("images")
    )
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]


class MyProductsView(generics.ListAPIView):
    """GET /products/my/  — returns only the current farmer's listings"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["ministry_product__name", "description", "category__name"]
    ordering_fields = ["unit_price", "created_at", "average_rating", "stock"]

    def get_queryset(self):
        return (
            Product.objects.filter(farm__farmer=self.request.user)
            .select_related("farm", "category", "ministry_product")
            .prefetch_related("images")
        )


class CreateProductView(generics.CreateAPIView):
    """POST /products/create/"""
    serializer_class = CreateProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {"request": self.request}


class UpdateProductView(generics.RetrieveUpdateAPIView):
    """GET/PUT/PATCH /products/<pk>/update/"""
    queryset = Product.objects.all().select_related("ministry_product", "farm")
    serializer_class = UpdateProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsFarmerOwner]

    def get_serializer_context(self):
        return {"request": self.request}


class DeleteProductView(generics.DestroyAPIView):
    """DELETE /products/<pk>/delete/"""
    queryset = Product.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsFarmerOwner]