from rest_framework import serializers
from .models import Mission, MissionDecline
from vehicules.models import Vehicle


class MissionSerializer(serializers.ModelSerializer):
    transporter_email = serializers.CharField(source="transporter.email", read_only=True)
    order_status = serializers.CharField(source="order.status", read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    decline_count = serializers.SerializerMethodField()

    class Meta:
        model = Mission
        fields = [
            "id", "order", "order_status",
            "transporter", "transporter_email",
            "vehicle", "vehicle_info",
            "status",
            "wilaya", "baladiya",
            "pickup_address", "delivery_address", "notes",
            "decline_count",
            "accepted_at", "picked_up_at", "delivered_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "wilaya", "baladiya",
            "transporter", "transporter_email",
            "order_status", "vehicle_info", "decline_count",
            "accepted_at", "picked_up_at", "delivered_at",
            "created_at", "updated_at",
        ]

    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return f"{obj.vehicle.type} - {obj.vehicle.model} ({obj.vehicle.year})"
        return None

    def get_decline_count(self, obj):
        return obj.declines.count()


class MissionCreateSerializer(serializers.ModelSerializer):
    """Used by FARMER to create a mission after confirming an order."""

    class Meta:
        model = Mission
        fields = ["order", "pickup_address", "delivery_address", "notes"]

    def validate_order(self, order):
        request = self.context["request"]
        farmer_profile = getattr(request.user, "farmer_profile", None)

        if farmer_profile is None:
            raise serializers.ValidationError("Only farmers can create missions.")

        # ✅ FIXED: Compare User with User
        if order.farm.farmer != request.user:
            raise serializers.ValidationError("This order does not belong to your farm.")

        # Only confirmed orders can get a mission
        if order.status != "confirmed":
            raise serializers.ValidationError(
                "A mission can only be created for a confirmed order."
            )

        # No duplicate missions
        if hasattr(order, "mission"):
            raise serializers.ValidationError("This order already has a mission.")

        return order

    def create(self, validated_data):
        order = validated_data["order"]
        farm = order.farm

        # Snapshot farm region into the mission
        validated_data["wilaya"] = farm.wilaya
        validated_data["baladiya"] = farm.baladiya

        # Auto-fill pickup address from farm if not provided
        if not validated_data.get("pickup_address"):
            validated_data["pickup_address"] = farm.address

        return Mission.objects.create(**validated_data)


class MissionAcceptSerializer(serializers.Serializer):
    """Used by TRANSPORTER to accept a mission. Optionally picks a vehicle."""
    vehicle_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_vehicle_id(self, vehicle_id):
        if vehicle_id is None:
            return None
        request = self.context["request"]
        try:
            vehicle = Vehicle.objects.get(pk=vehicle_id, transporter=request.user)
        except Vehicle.DoesNotExist:
            raise serializers.ValidationError(
                "Vehicle not found or does not belong to you."
            )
        return vehicle

    def validate(self, attrs):
        mission = self.context["mission"]
        if mission.status != Mission.STATUS_PENDING:
            raise serializers.ValidationError(
                {"detail": "This mission is no longer available."}
            )
        return attrs


class MissionStatusUpdateSerializer(serializers.Serializer):
    """Used by TRANSPORTER to advance mission status after accepting."""
    status = serializers.ChoiceField(choices=[
        Mission.STATUS_PICKED_UP,
        Mission.STATUS_IN_TRANSIT,
        Mission.STATUS_DELIVERED,
    ])

    def validate_status(self, new_status):
        mission = self.context["mission"]
        if not mission.can_transition(new_status):
            raise serializers.ValidationError(
                f"Cannot transition from '{mission.status}' to '{new_status}'."
            )
        return new_status


class MissionCancelSerializer(serializers.Serializer):
    """Used by FARMER to cancel a pending or accepted mission."""

    def validate(self, attrs):
        mission = self.context["mission"]
        if mission.status not in [Mission.STATUS_PENDING, Mission.STATUS_ACCEPTED]:
            raise serializers.ValidationError(
                {"detail": "You can only cancel a pending or accepted mission."}
            )
        return attrs