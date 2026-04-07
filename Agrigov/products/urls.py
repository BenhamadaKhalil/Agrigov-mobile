from django.urls import path
from .views import (
    # MinistryProduct
    MinistryProductListView,
    MinistryProductDetailView,
    MinistryProductCreateView,
    MinistryProductUpdateView,
    MinistryProductDeleteView,
    # Product (farmer listings)
    ProductListView,
    ProductDetailView,
    MyProductsView,
    CreateProductView,
    UpdateProductView,
    DeleteProductView,
)

urlpatterns = [
    # ── Ministry product catalogue (admin writes, everyone reads) ──
    path("ministry/", MinistryProductListView.as_view()),
    path("ministry/<int:pk>/", MinistryProductDetailView.as_view()),
    path("ministry/create/", MinistryProductCreateView.as_view()),
    path("ministry/<int:pk>/update/", MinistryProductUpdateView.as_view()),
    path("ministry/<int:pk>/delete/", MinistryProductDeleteView.as_view()),

    # ── Farmer product listings ──
    path("", ProductListView.as_view()),
    path("<int:pk>/", ProductDetailView.as_view()),
    path("my/", MyProductsView.as_view()),
    path("create/", CreateProductView.as_view()),
    path("<int:pk>/update/", UpdateProductView.as_view()),
    path("<int:pk>/delete/", DeleteProductView.as_view()),
]