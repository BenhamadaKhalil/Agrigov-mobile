from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Mission, MissionDecline
from .serializers import (
    MissionSerializer,
    MissionCreateSerializer,
    MissionAcceptSerializer,
    MissionStatusUpdateSerializer,
    MissionCancelSerializer,
)
from .permissions import IsFarmer, IsTransporter, IsTransporterOrAdmin
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .filters import MissionFilter


# ─────────────────────────────────────────────
# FARMER: Create a mission for a confirmed order
# ─────────────────────────────────────────────
class MissionCreateView(generics.CreateAPIView):
    """
    POST /api/missions/
    Farmer creates a mission after confirming an order.
    The mission is auto-tagged with the farm's wilaya + baladiya.
    """
    serializer_class = MissionCreateSerializer
    permission_classes = [IsFarmer]

    def perform_create(self, serializer):
        serializer.save()


# ─────────────────────────────────────────────
# FARMER: List missions for farmer's own orders
# ─────────────────────────────────────────────
class FarmerMissionListView(generics.ListAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsFarmer]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MissionFilter

    search_fields = [
        "order__id",
        "pickup_address",
        "delivery_address",
        "notes",
    ]

    ordering_fields = [
        "created_at",
        "status",
        "accepted_at",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        return Mission.objects.filter(
            order__farm__farmer=user
        ).select_related("order", "transporter", "vehicle")


# ─────────────────────────────────────────────
# FARMER: Cancel a mission
# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
# FARMER: Cancel a mission
# ─────────────────────────────────────────────
class MissionCancelView(APIView):
    """
    PATCH /api/missions/<id>/cancel/
    Farmer cancels a pending or accepted mission.
    """
    permission_classes = [IsFarmer]

    def patch(self, request, pk):
        try:
            user = request.user
            mission = Mission.objects.get(pk=pk, order__farm__farmer=user)
        except Mission.DoesNotExist:
            return Response({"detail": "Mission not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = MissionCancelSerializer(
            data={}, context={"mission": mission}
        )
        serializer.is_valid(raise_exception=True)

        mission.status = Mission.STATUS_CANCELLED
        mission.order.status = "confirmed"
        mission.order.save()
        mission.save()

        return Response(MissionSerializer(mission).data)


# ─────────────────────────────────────────────
# TRANSPORTER: See available missions in their region
# ─────────────────────────────────────────────
class AvailableMissionsView(generics.ListAPIView):
    """
    GET /api/missions/available/
    Transporter sees pending missions in their wilaya.
    Missions they already declined are excluded.
    Missions are ordered: exact baladiya match first, then wilaya-only.
    """
    serializer_class = MissionSerializer
    permission_classes = [IsTransporter]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MissionFilter

    search_fields = [
        "pickup_address",
        "delivery_address",
        "notes",
    ]

    ordering_fields = ["created_at"]

    def get_queryset(self):
        user = self.request.user
        transporter_profile = getattr(user, "transporter_profile", None)

        if not transporter_profile:
            return Mission.objects.none()

        wilaya = transporter_profile.wilaya
        baladiya = transporter_profile.baladiya

        # Exclude missions this transporter already declined
        declined_ids = MissionDecline.objects.filter(
            transporter=user
        ).values_list("mission_id", flat=True)

        qs = Mission.objects.filter(
            status=Mission.STATUS_PENDING,
            wilaya__iexact=wilaya,
        ).exclude(id__in=declined_ids).select_related("order", "vehicle")

        # Sort: same baladiya first
        from django.db.models import Case, When, IntegerField
        qs = qs.annotate(
            region_priority=Case(
                When(baladiya__iexact=baladiya, then=0),
                default=1,
                output_field=IntegerField(),
            )
        ).order_by("region_priority", "-created_at")

        return qs


# ─────────────────────────────────────────────
# TRANSPORTER: Accept a mission
# ─────────────────────────────────────────────
class MissionAcceptView(APIView):
    """
    POST /api/missions/<id>/accept/
    Transporter accepts a pending mission (first come, first served).
    Optionally passes vehicle_id.
    """
    permission_classes = [IsTransporter]

    def post(self, request, pk):
        try:
            mission = Mission.objects.get(pk=pk, status=Mission.STATUS_PENDING)
        except Mission.DoesNotExist:
            return Response(
                {"detail": "Mission not found or no longer available."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Confirm transporter is in the right region
        transporter_profile = getattr(request.user, "transporter_profile", None)
        if not transporter_profile or transporter_profile.wilaya.lower() != mission.wilaya.lower():
            return Response(
                {"detail": "This mission is not in your region."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MissionAcceptSerializer(
            data=request.data,
            context={"mission": mission, "request": request}
        )
        serializer.is_valid(raise_exception=True)

        mission.transporter = request.user
        mission.vehicle = serializer.validated_data.get("vehicle_id")
        mission.status = Mission.STATUS_ACCEPTED
        mission.accepted_at = timezone.now()
        mission.save()

        return Response(MissionSerializer(mission).data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
# TRANSPORTER: Decline a mission
# ─────────────────────────────────────────────
class MissionDeclineView(APIView):
    """
    POST /api/missions/<id>/decline/
    Transporter declines a pending mission.
    Mission stays pending for other transporters in the region.
    """
    permission_classes = [IsTransporter]

    def post(self, request, pk):
        try:
            mission = Mission.objects.get(pk=pk, status=Mission.STATUS_PENDING)
        except Mission.DoesNotExist:
            return Response(
                {"detail": "Mission not found or no longer available."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent double-declining
        already_declined = MissionDecline.objects.filter(
            mission=mission, transporter=request.user
        ).exists()
        if already_declined:
            return Response({"detail": "You already declined this mission."}, status=status.HTTP_400_BAD_REQUEST)

        MissionDecline.objects.create(mission=mission, transporter=request.user)

        return Response({"detail": "Mission declined. It remains open for other transporters."})


# ─────────────────────────────────────────────
# TRANSPORTER: Update mission status after accepting
# ─────────────────────────────────────────────
class MissionStatusUpdateView(APIView):
    """
    PATCH /api/missions/<id>/status/
    Transporter moves the mission forward:
    accepted → picked_up → in_transit → delivered
    """
    permission_classes = [IsTransporterOrAdmin]

    def patch(self, request, pk):
        try:
            if request.user.role == "TRANSPORTER":
                mission = Mission.objects.get(pk=pk, transporter=request.user)
            else:
                mission = Mission.objects.get(pk=pk)
        except Mission.DoesNotExist:
            return Response({"detail": "Mission not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = MissionStatusUpdateSerializer(
            data=request.data,
            context={"mission": mission, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        now = timezone.now()
        if new_status == Mission.STATUS_PICKED_UP:
            mission.picked_up_at = now
        elif new_status == Mission.STATUS_DELIVERED:
            mission.delivered_at = now
            mission.order.status = "delivered"
            mission.order.save()

        mission.status = new_status
        mission.save()

        return Response(MissionSerializer(mission).data)


# ─────────────────────────────────────────────
# TRANSPORTER: List own missions
# ─────────────────────────────────────────────
class TransporterMissionListView(generics.ListAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsTransporter]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MissionFilter

    search_fields = [
        "order__id",
        "pickup_address",
        "delivery_address",
    ]

    ordering_fields = [
        "created_at",
        "status",
        "accepted_at",
        "delivered_at",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Mission.objects.filter(
            transporter=self.request.user
        ).select_related("order", "vehicle")


# ─────────────────────────────────────────────
# SHARED: Mission detail (all roles)
# ─────────────────────────────────────────────
class MissionDetailView(generics.RetrieveAPIView):
    """
    GET /api/missions/<id>/
    """
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return Mission.objects.all()
        if user.role == "TRANSPORTER":
            return Mission.objects.filter(transporter=user)
        if user.role == "FARMER":
            return Mission.objects.filter(order__farm__farmer__user=user)
        if user.role == "BUYER":
            return Mission.objects.filter(order__buyer__user=user)
        return Mission.objects.none()