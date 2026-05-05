from rest_framework import serializers
from .models import Vehicle
from users.models import User


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["transporter"]

    def create(self, validated_data):
        user = self.context["request"].user

        if user.role != User.ROLE_TRANSPORTER:
            raise serializers.ValidationError("Only transporters can add vehicles")

        return Vehicle.objects.create(transporter=user, **validated_data)