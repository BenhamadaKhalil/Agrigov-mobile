from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from products.models import Product
from users.models import BuyerProfile


class Review(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    buyer = models.ForeignKey(
        BuyerProfile,
        on_delete=models.CASCADE,
        related_name='reviews'
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.rating}★ by {self.buyer.user.username}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'buyer'],
                name='unique_review_per_buyer_product'
            )
        ]
        ordering = ['-created_at']  