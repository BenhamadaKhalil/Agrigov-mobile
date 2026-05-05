from rest_framework import serializers
from .models import OfficialPrice
from products.serializers import MinistryProductSerializer
from regions.utils import get_region_from_wilaya


class OfficialPriceSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)
    product_detail = MinistryProductSerializer(source="product", read_only=True)
    region_name = serializers.SerializerMethodField()

    class Meta:
        model = OfficialPrice
        fields = [
            "id",
            "product",          # write: accepts MinistryProduct PK
            "product_detail",   # read: full nested object
            "wilaya",
            "min_price",
            "max_price",
            "unit",
            "valid_from",
            "valid_until",
            "is_active",
            "region_name",
        ]

    def get_region_name(self, obj):
        if obj.wilaya:
            return get_region_from_wilaya(obj.wilaya)
        return obj.region if obj.region else "National"

    def validate(self, data):
        min_p = data.get("min_price")
        max_p = data.get("max_price")
        if min_p and max_p and min_p > max_p:
            raise serializers.ValidationError("min_price must be less than max_price.")
        return data