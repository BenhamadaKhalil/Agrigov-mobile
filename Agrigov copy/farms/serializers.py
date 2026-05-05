from rest_framework import serializers
from .models import Farm
from users.models import User

class FarmSerializer(serializers.ModelSerializer):
    # Explicitly declare the region property so DRF includes it
    region = serializers.ReadOnlyField()

    class Meta:
        model = Farm
        # List the fields explicitly to guarantee 'region' is included alongside the others
        fields = [
            'id', 'farmer', 'name', 'wilaya', 'region', 
            'baladiya', 'farm_size', 'address', 'created_at'
        ]
        read_only_fields = ["farmer"]

    def create(self, validated_data):
        user = self.context["request"].user

        if user.role != User.ROLE_FARMER:
            raise serializers.ValidationError("Only farmers can create farms")

        return Farm.objects.create(farmer=user, **validated_data)