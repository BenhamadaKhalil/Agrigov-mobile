import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    # ── Price ──────────────────────────────────────────
    min_price = django_filters.NumberFilter(field_name="unit_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="unit_price", lookup_expr="lte")

    # ── Ministry product ───────────────────────────────
    ministry_product = django_filters.NumberFilter(field_name="ministry_product__id")
    ministry_product_slug = django_filters.CharFilter(field_name="ministry_product__slug")

    # ── Category ───────────────────────────────────────
    category = django_filters.CharFilter(field_name="category__slug")
    category_id = django_filters.NumberFilter(field_name="category__id")

    # ── Season ─────────────────────────────────────────
    season = django_filters.ChoiceFilter(choices=Product.SEASON_CHOICES)

    # ── Stock ──────────────────────────────────────────
    in_stock = django_filters.BooleanFilter()
    min_stock = django_filters.NumberFilter(field_name="stock", lookup_expr="gte")

    # ── Farm ───────────────────────────────────────────
    farm = django_filters.NumberFilter(field_name="farm__id")

    # ── Rating ─────────────────────────────────────────
    min_rating = django_filters.NumberFilter(field_name="average_rating", lookup_expr="gte")

    # ── Date ───────────────────────────────────────────
    created_after = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")

    # ── Has images ─────────────────────────────────────
    has_images = django_filters.BooleanFilter(method="filter_has_images")

    class Meta:
        model = Product
        fields = [
            "ministry_product",
            "ministry_product_slug",
            "category",
            "category_id",
            "season",
            "in_stock",
            "farm",
        ]

    def filter_has_images(self, queryset, name, value):
        if value:
            return queryset.filter(images__isnull=False).distinct()
        return queryset