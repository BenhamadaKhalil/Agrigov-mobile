from .models import CartItem, Cart
from products.models import Product
from django.db import transaction

def add_to_cart(cart: Cart, product: Product, quantity: int = 1):
    with transaction.atomic():
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'price': product.unit_price}  # freeze price at add time
        )

        if not created:
            item.quantity += quantity

        item.save()
        return item

