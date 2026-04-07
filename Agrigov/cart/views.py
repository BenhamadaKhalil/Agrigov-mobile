from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated
from rest_framework.response import Response
from .models import Cart, CartItem
from .serializers import CartSerializer, AddCartItemSerializer, UpdateQuantitySerializer
from .utils import add_to_cart
from products.models import Product
from rest_framework.permissions import IsAuthenticated

from django.db import transaction
from django.shortcuts import get_object_or_404


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_cart(self, user):
        buyer_profile = getattr(user, 'buyer_profile', None)
        if not buyer_profile:
            raise NotAuthenticated('User has no buyer profile')

        return Cart.objects.prefetch_related('items__product').get_or_create(
            buyer=buyer_profile
        )[0]

    # -------------------
    # GET CART
    # -------------------
    def list(self, request):
        cart = self.get_cart(request.user)
        return Response(CartSerializer(cart).data)

    # -------------------
    # ADD ITEM
    # -------------------
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = get_object_or_404(Product, id=serializer.validated_data['product_id'])

        cart = self.get_cart(request.user)
        add_to_cart(cart, product, serializer.validated_data['quantity'])

        return Response({"message": "Item added to cart successfully"}, status=status.HTTP_200_OK)

    # -------------------
    # REMOVE ITEM (RESTFUL ✅)
    # -------------------
    @action(detail=False, methods=['delete'], url_path='remove-item/(?P<product_id>[^/.]+)')
    def remove_item(self, request, product_id=None):
        cart = self.get_cart(request.user)

        item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        item.delete()

        return Response({"message": "Item removed from cart successfully"}, status=status.HTTP_200_OK)

    # -------------------
    # UPDATE QUANTITY
    # -------------------
    @action(detail=False, methods=['patch'])
    def update_quantity(self, request):
        serializer = UpdateQuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = self.get_cart(request.user)

        item = get_object_or_404(
            CartItem,
            cart=cart,
            product_id=serializer.validated_data['product_id']
        )

        item.quantity = serializer.validated_data['quantity']
        item.save()

        return Response({"message": "Item Updated successfully"}, status=status.HTTP_200_OK)

    # -------------------
    # CLEAR CART
    # -------------------
    @action(detail=False, methods=['delete'])
    def clear_cart(self, request):
        cart = self.get_cart(request.user)
        cart.items.all().delete()

        return Response({"message": "A clear cart !"}, status=status.HTTP_200_OK)