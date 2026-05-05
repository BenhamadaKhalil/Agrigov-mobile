import django_filters
from .models import Mission


class MissionFilter(django_filters.FilterSet):
    # 🔹 Exact filters
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    wilaya = django_filters.CharFilter(field_name="wilaya", lookup_expr="iexact")
    baladiya = django_filters.CharFilter(field_name="baladiya", lookup_expr="iexact")

    # 🔹 Related filters
    order_id = django_filters.NumberFilter(field_name="order__id")
    transporter_id = django_filters.NumberFilter(field_name="transporter__id")

    # 🔹 Date range filters
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Mission
        fields = [
            "status",
            "wilaya",
            "baladiya",
            "order_id",
            "transporter_id",
        ]