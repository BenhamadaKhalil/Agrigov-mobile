import django_filters
from .models import Order


class OrderFilter(django_filters.FilterSet):
    # 🔍 Exact filters
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    farm = django_filters.NumberFilter(field_name="farm__id")
    buyer = django_filters.NumberFilter(field_name="buyer__id")

    # 📅 Date filters
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    # 💰 Price range (if you have total_price field)
    min_price = django_filters.NumberFilter(field_name="total_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="total_price", lookup_expr="lte")

    class Meta:
        model = Order
        fields = [
            "status",
            "farm",
            "buyer",
        ]