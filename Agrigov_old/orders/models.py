from django.db import models
from products.models import Product
from users.models import BuyerProfile
from farms.models import Farm


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    VALID_TRANSITIONS = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': [],
    }

    STATUS_PERMISSIONS = {
        'FARMER': ['confirmed'],
        'BUYER': ['cancelled'],
        'TRANSPORTER': ['shipped', 'delivered'],
        'ADMIN': ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    }

    buyer = models.ForeignKey(
        BuyerProfile,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name='orders'
    )

    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id}"


    def can_transition(self, new_status):
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def get_allowed_statuses_for_user(self, user):
        if not user or not user.is_authenticated:
            return []

        role_allowed = self.STATUS_PERMISSIONS.get(user.role, [])

        valid_transitions = self.VALID_TRANSITIONS.get(self.status, [])

        allowed = [s for s in role_allowed if s in valid_transitions]

        if user.role == 'BUYER' and self.status != 'pending':
            allowed = [s for s in allowed if s != 'cancelled']

        return allowed

    def can_user_change_status(self, user, new_status):
        if not self.can_transition(new_status):
            return False

        return new_status in self.get_allowed_statuses_for_user(user)



class ProductItem(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name="history_items"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    season = models.CharField(max_length=20)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    category_name = models.CharField(max_length=255, null=True, blank=True)
    product_id_original = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Snapshot of {self.title}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )

    product_item = models.ForeignKey(
        ProductItem,
        on_delete=models.CASCADE,
        related_name='order_items',
    )

    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.product_item.title} x {self.quantity}"

    @property
    def total_price(self):
        if not self.product_item:
            return 0  
        return self.product_item.unit_price * self.quantity
    
    
class Invoice(models.Model):
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="invoice"
    )

    pdf_url = models.URLField()
    public_id = models.CharField(max_length=255) 

    created_at = models.DateTimeField(auto_now_add=True)
