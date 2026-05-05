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

        # Check stock before adding
        existing_item = CartItem.objects.filter(cart=cart, product=product).first()
        total_quantity = serializer.validated_data['quantity'] + (existing_item.quantity if existing_item else 0)
        if total_quantity > product.stock:
            return Response({'error': f'Not enough stock. Available: {product.stock}'}, status=400)

        add_to_cart(cart, product, serializer.validated_data['quantity'])

        return Response({"message": "Item added to cart successfully"}, status=status.HTTP_200_OK)

    # -------------------
    # REMOVE ITEM (RESTFUL ✅)
    # -------------------
    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({'error': 'item_id required'}, status=400)

        cart = self.get_cart(request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
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