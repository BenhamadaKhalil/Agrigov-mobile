from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer  # assumes you have a ProductSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)  # nested product details
    total_price = serializers.ReadOnlyField()     # computed property

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'price', 'total_price']
        read_only_fields = ['price', 'total_price']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)  # nested items
    total_price = serializers.ReadOnlyField()
    total_items = serializers.ReadOnlyField()
    farms = serializers.StringRelatedField(many=True)  # returns string of farms

    class Meta:
        model = Cart
        fields = ['id', 'buyer', 'items', 'total_items', 'total_price', 'farms']
        read_only_fields = ['buyer', 'items', 'total_items', 'total_price', 'farms']

class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class UpdateQuantitySerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)