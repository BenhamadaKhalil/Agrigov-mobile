from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import OfficialPrice
from .serializers import OfficialPriceSerializer
from .permissions import IsAdmin
from .services import get_active_price, expire_old_price


class CurrentPriceView(APIView):
    """
    GET /official-prices/current/?product_id=<id>&wilaya=<wilaya>
    Public endpoint — returns the active price for a ministry product.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        product_id = request.query_params.get("product_id")
        wilaya = request.query_params.get("wilaya", "")

        if not product_id:
            return Response(
                {"error": "product_id query param is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product_id = int(product_id)
        except ValueError:
            return Response(
                {"error": "product_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        price = get_active_price(product_id, wilaya)
        if not price:
            return Response(
                {"error": "No active price found for this product."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(OfficialPriceSerializer(price).data)


class OfficialPriceCreateView(generics.CreateAPIView):
    """POST /official-prices/create/  — admin only"""
    queryset = OfficialPrice.objects.all()
    serializer_class = OfficialPriceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def perform_create(self, serializer):
        product = serializer.validated_data["product"]
        wilaya = serializer.validated_data.get("wilaya", "")
        region = serializer.validated_data.get("region", "")
        expire_old_price(product.id, wilaya, region)
        serializer.save(set_by=self.request.user)


class OfficialPriceUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /official-prices/<pk>/  — admin only"""
    queryset = OfficialPrice.objects.all()
    serializer_class = OfficialPriceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def perform_update(self, serializer):
        serializer.save(set_by=self.request.user)


class OfficialPriceListView(generics.ListAPIView):
    """GET /official-prices/  — admin can see all prices"""
    queryset = OfficialPrice.objects.select_related("product").all()
    serializer_class = OfficialPriceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
