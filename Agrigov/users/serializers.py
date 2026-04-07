from rest_framework import serializers
from django.contrib.auth import authenticate

from utils.cloudinary import build_cloudinary_url
from .models import MinistryProfile, User, FarmerProfile, TransporterProfile, BuyerProfile
from farms.models import Farm
from vehicules.models import Vehicle


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "phone", "role", "is_verified", "is_active", "created_at"]


class MeSerializer(serializers.Serializer):
    user = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    extras = serializers.SerializerMethodField()

    def get_user(self, obj):
        return UserSerializer(obj).data


    def get_profile(self, user):
        if user.role == User.ROLE_FARMER and hasattr(user, "farmer_profile"):
            return FarmerProfileSerializer(user.farmer_profile).data

        if user.role == User.ROLE_TRANSPORTER and hasattr(user, "transporter_profile"):
            return TransporterProfileSerializer(user.transporter_profile).data

        if user.role == User.ROLE_BUYER and hasattr(user, "buyer_profile"):
            return BuyerProfileSerializer(user.buyer_profile).data

        if user.role == User.ROLE_ADMIN and hasattr(user, "ministry_profile"):
            return MinistryProfileSerializer(user.ministry_profile).data

        return None

    def get_extras(self, user):
        data = {}

        if user.role == User.ROLE_FARMER:
            from farms.models import Farm
            data["farms_count"] = Farm.objects.filter(farmer=user).count()

        if user.role == User.ROLE_TRANSPORTER:
            from vehicules.models import Vehicle
            data["vehicles_count"] = Vehicle.objects.filter(transporter=user).count()

        if user.role == User.ROLE_BUYER:
            from orders.models import Order
            data["orders_count"] = Order.objects.filter(buyer__user=user).count()

        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "username", "phone", "role", "password"]

    def validate_role(self, value):
        if value not in [User.ROLE_FARMER, User.ROLE_BUYER, User.ROLE_TRANSPORTER]:
            raise serializers.ValidationError("Invalid role for registration.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(request=self.context.get("request"), **attrs)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        attrs["user"] = user
        return attrs


class FarmerProfileSerializer(serializers.ModelSerializer):
    farmer_card_image = serializers.SerializerMethodField()
    national_id_image = serializers.SerializerMethodField()

    class Meta:
        model = FarmerProfile
        fields = [
            "age",
            "wilaya",
            "baladiya",
            "farm_size",
            "address",
            "farmer_card_image",
            "national_id_image",
        ]

    def get_farmer_card_image(self, obj):
        return build_cloudinary_url(obj.farmer_card_image)

    def get_national_id_image(self, obj):
        return build_cloudinary_url(obj.national_id_image)


class TransporterProfileSerializer(serializers.ModelSerializer):
    driver_license_image = serializers.SerializerMethodField()
    grey_card_image = serializers.SerializerMethodField()

    vehicle_type = serializers.CharField(write_only=True)
    vehicle_model = serializers.CharField(write_only=True)
    vehicle_year = serializers.IntegerField(write_only=True)
    vehicle_capacity = serializers.FloatField(write_only=True)

    class Meta:
        model = TransporterProfile
        fields = [
            "age",
            "driver_license_image",
            "grey_card_image",
            "vehicle_type",
            "vehicle_model",
            "vehicle_year",
            "vehicle_capacity",
        ]

    def get_driver_license_image(self, obj):
        return build_cloudinary_url(obj.driver_license_image)

    def get_grey_card_image(self, obj):
        return build_cloudinary_url(obj.grey_card_image)


class BuyerProfileSerializer(serializers.ModelSerializer):
    bussiness_license_image = serializers.ImageField(write_only=True)

    class Meta:
        model = BuyerProfile
        fields = ["age", "bussiness_license_image"]
        read_only_fields = ["is_validated", "validated_at", "rejection_reason", "rejected_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        if user.role != User.ROLE_BUYER:
            raise serializers.ValidationError("Only buyers allowed")
        if hasattr(user, "buyer_profile"):
            raise serializers.ValidationError("Profile already exists")
        return BuyerProfile.objects.create(user=user, **validated_data)


class MinistryProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    
    class Meta:
        model = MinistryProfile
        fields = ["id", "user", "email", "role", "phone", "office_address", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "email", "role", "created_at", "updated_at"]
    
    def create(self, validated_data):
        user = self.context["request"].user
        if user.role != User.ROLE_ADMIN:
            raise serializers.ValidationError("Only ministry users allowed")
        if hasattr(user, "ministry_profile"):
            raise serializers.ValidationError("Profile already exists")
        return MinistryProfile.objects.create(
            user=user,
            phone=validated_data.get("phone", ""),
            office_address=validated_data.get("office_address", "")
        )
    
    def update(self, instance, validated_data):
        instance.phone = validated_data.get("phone", instance.phone)
        instance.office_address = validated_data.get("office_address", instance.office_address)
        instance.save()
        return instance


# ============================================
# USER VALIDATION SERIALIZERS (For Ministry)
# ============================================

class ValidateUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        
        if user.role == "FARMER" and not hasattr(user, 'farmer_profile'):
            raise serializers.ValidationError("Farmer has no profile")
        if user.role == "TRANSPORTER" and not hasattr(user, 'transporter_profile'):
            raise serializers.ValidationError("Transporter has no profile")
        if user.role == "BUYER" and not hasattr(user, 'buyer_profile'):
            raise serializers.ValidationError("Buyer has no profile")
        return value


class RejectUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    reason = serializers.CharField(max_length=500, required=True)
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        
        if user.role == "FARMER" and not hasattr(user, 'farmer_profile'):
            raise serializers.ValidationError("Farmer has no profile")
        if user.role == "TRANSPORTER" and not hasattr(user, 'transporter_profile'):
            raise serializers.ValidationError("Transporter has no profile")
        if user.role == "BUYER" and not hasattr(user, 'buyer_profile'):
            raise serializers.ValidationError("Buyer has no profile")
        return value
    
    def validate_reason(self, value):
        import html
        return html.escape(value[:500])