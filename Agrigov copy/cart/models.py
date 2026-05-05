from django.db import models
from products.models import Product
from users.models import BuyerProfile


from django.db import models
from django.db.models import Sum, F
from products.models import Product
from users.models import BuyerProfile


class Cart(models.Model):
    buyer = models.OneToOneField(
        BuyerProfile,
        on_delete=models.CASCADE,
        related_name='cart'
    )

    def __str__(self):
        return f"Cart {self.id} - {self.buyer}"

    @property
    def total_price(self):
        return self.items.aggregate(
            total=Sum(F('price') * F('quantity'))
        )['total'] or 0

    @property
    def total_items(self):
        return self.items.aggregate(
            total=Sum('quantity')
        )['total'] or 0

    @property
    def farms(self):
        return list(
            self.items.values_list('product__farm', flat=True).distinct()
        )

class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('cart', 'product')

    @property
    def total_price(self):
        return self.price * self.quantity