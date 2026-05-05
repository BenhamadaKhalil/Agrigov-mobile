from rest_framework import serializers
from django.db import transaction

from .models import Product, ProductImage, MinistryProduct
from categories.models import Category
from farms.models import Farm
from farms.serializers import FarmSerializer
from official_prices.services import validate_price


# ─────────────────────────────────────────────
#  MinistryProduct serializers
# ─────────────────────────────────────────────
class MinistryProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = MinistryProduct
        fields = ["id", "name", "slug", "category", "category_name", "description", "is_active"]
        read_only_fields = ["slug"]


class MinistryProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MinistryProduct
        fields = ["id", "name", "category", "description", "is_active"]


# ─────────────────────────────────────────────
#  ProductImage
# ─────────────────────────────────────────────
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image"]

    def get_image(self, obj):
        return obj.image.url


# ─────────────────────────────────────────────
#  Product – read (list / detail)
# ─────────────────────────────────────────────
class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    farmer_name = serializers.CharField(source="farm.farmer.username", read_only=True)
    farm = FarmSerializer(read_only=True)
    ministry_product = MinistryProductSerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "ministry_product",
            "farm",
            "farmer_name",
            "category_name",
            "description",
            "season",
            "unit_price",
            "stock",
            "in_stock",
            "images",
            "average_rating",
            "review_count",
            "created_at",
        ]


# ─────────────────────────────────────────────
#  Product – create
# ─────────────────────────────────────────────
class CreateProductSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )

    farm_id = serializers.IntegerField(write_only=True)
    ministry_product_id = serializers.PrimaryKeyRelatedField(
        queryset=MinistryProduct.objects.filter(is_active=True),
        source="ministry_product",
    )

    class Meta:
        model = Product
        fields = [
            "ministry_product_id",
            "description",
            "season",
            "unit_price",
            "stock",
            "farm_id",
            "images",
        ]

    def validate_farm_id(self, value):
        user = self.context["request"].user

        if not Farm.objects.filter(id=value, farmer=user).exists():
            raise serializers.ValidationError("Invalid farm or not yours.")
        return value

    def validate(self, data):
        farm_id = data.get("farm_id")
        unit_price = data.get("unit_price")
        ministry_product: MinistryProduct = data.get("ministry_product")

        try:
            farm = Farm.objects.get(id=farm_id)
        except Farm.DoesNotExist:
            raise serializers.ValidationError({"farm_id": "Farm not found."})

        wilaya = getattr(farm, "wilaya", "") or ""

        is_valid, price_range, message = validate_price(
            ministry_product_id=ministry_product.id,
            price=unit_price,
            wilaya=wilaya,
        )

        if price_range is None:
            raise serializers.ValidationError({
                "ministry_product_id": (
                    f"No official price has been set for '{ministry_product.name}'. "
                    "Please contact the Ministry of Agriculture."
                )
            })

        if not is_valid:
            raise serializers.ValidationError({"unit_price": message})

        data["_farm"] = farm
        return data

    @transaction.atomic
    def create(self, validated_data):
        images = validated_data.pop("images", [])
        validated_data.pop("farm_id")
        farm = validated_data.pop("_farm")

        product = Product.objects.create(farm=farm, **validated_data)

        for img in images:
            ProductImage.objects.create(product=product, image=img)

        return product


# ─────────────────────────────────────────────
#  Product – update
#  Note: ministry_product is intentionally NOT editable after creation.
# ─────────────────────────────────────────────
class UpdateProductSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Product
        fields = ["description", "season", "unit_price", "stock", "images"]

    def validate(self, data):
        product = self.instance
        unit_price = data.get("unit_price", product.unit_price)
        wilaya = getattr(product.farm, "wilaya", "") or ""

        is_valid, price_range, message = validate_price(
            ministry_product_id=product.ministry_product_id,
            price=unit_price,
            wilaya=wilaya,
        )

        if price_range is None:
            raise serializers.ValidationError({
                "unit_price": (
                    f"No official price for '{product.ministry_product.name}'. "
                    "Contact the Ministry."
                )
            })

        if not is_valid:
            raise serializers.ValidationError({"unit_price": message})

        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        images = validated_data.pop("images", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if images is not None:
            for img in instance.images.all():
                img.image.delete(save=False)
                img.delete()
            for img in images:
                ProductImage.objects.create(product=instance, image=img)

        return instance