from rest_framework import generics, permissions
from .models import Vehicle
from .serializers import VehicleSerializer


class CreateVehicleView(generics.CreateAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {"request": self.request}


class ListMyVehiclesView(generics.ListAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Vehicle.objects.filter(transporter=self.request.user)