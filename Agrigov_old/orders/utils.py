from collections import defaultdict
from django.db import transaction
from .models import Order, OrderItem
from products.models import Product
from .models import Order, OrderItem, ProductItem

@transaction.atomic
def create_orders_from_cart(buyer, cart):
    items = cart.items.select_related('product__farm')

    if not items.exists():
        raise ValueError("Cart is empty")

    farm_groups = defaultdict(list)

    for item in items:
        farm_groups[item.product.farm].append(item)

    created_orders = []

    for farm, farm_items in farm_groups.items():
        order = Order.objects.create(
            buyer=buyer,
            farm=farm,
            total_price=0
        )

        total = 0

        for item in farm_items:
            # ✅ stock validation
            if item.quantity > item.product.stock:
                raise ValueError(f"Not enough stock for {item.product.name}")

            #CREATE PRODUCT SNAPSHOT
            product = item.product

            product_item = ProductItem.objects.create(
                product=product,
                title=product.ministry_product.name,
                description=product.description,
                unit_price=item.price,
                category_name=product.category.name if product.category else None,
                product_id_original=product.id,
                season=product.season 
            )

            OrderItem.objects.create(
                order=order,
                product_item=product_item,
                quantity=item.quantity
            )

            total += item.price * item.quantity

        order.total_price = total
        order.save()

        created_orders.append(order)

    #  clear cart after success
    cart.items.all().delete()

    return created_orders
