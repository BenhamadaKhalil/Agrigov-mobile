from rest_framework import generics, permissions
from .models import Farm
from .serializers import FarmSerializer


class CreateFarmView(generics.CreateAPIView):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {"request": self.request}


class ListMyFarmsView(generics.ListAPIView):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Farm.objects.filter(farmer=self.request.user)