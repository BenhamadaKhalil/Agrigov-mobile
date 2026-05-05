from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer, CheckoutSerializer
from django.http import FileResponse
from .services.invoice_service import generate_invoice_pdf
from .services.workflow_service import handle_invoice_generation
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .filters import OrderFilter
class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter

    search_fields = [
        "id",
        "buyer__user__username",
        "farm__name",
        "items__product_item__title",
    ]

    ordering_fields = [
        "created_at",
        "status",
        "total_price",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        queryset = Order.objects.select_related(
            'buyer', 'farm'
        ).prefetch_related(
            'items__product_item'
        )

        if user.role == 'BUYER':
            return queryset.filter(buyer=user.buyer_profile)

        if user.role == 'FARMER':
            return queryset.filter(farm__farmer=user)

        if user.role == 'TRANSPORTER':
            return queryset.filter(status__in=['confirmed', 'shipped'])

        if user.role == 'ADMIN':
            return queryset

        return Order.objects.none()


    @action(detail=False, methods=['post'])
    def checkout(self, request):
        serializer = CheckoutSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        orders = serializer.save()

        return Response({"message": "Order created !"}, status=status.HTTP_200_OK)



    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response({'error': 'Status required'}, status=400)

        if not order.can_user_change_status(request.user, new_status):
            return Response({'error': 'Not allowed'}, status=403)

        order.status = new_status
        order.save()

        # TRIGGER INVOICE WHEN DELIVERED
        if new_status == "delivered":
            handle_invoice_generation(order)

        return Response(
            OrderSerializer(order, context={'request': request}).data
        )
    
    
    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        order = self.get_object()
        user = request.user

        if (user.role == "BUYER" and order.buyer != user.buyer_profile) or \
           (user.role == "FARMER" and order.farm.farmer != user):
            return Response({"error": "Not allowed"}, status=403)

        pdf_buffer = generate_invoice_pdf(order)

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"invoice_{order.id}.pdf",
            content_type='application/pdf'
        )