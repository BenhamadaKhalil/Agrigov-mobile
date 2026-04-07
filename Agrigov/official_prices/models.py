from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import User
from regions.utils import get_region_from_wilaya
from products.models import MinistryProduct


class OfficialPrice(models.Model):
    UNIT_CHOICES = [
        ("kg", "Kilogram"),
        ("ton", "Ton"),
        ("box", "Box"),
        ("bag", "Bag"),
    ]

    # ← FK instead of product_name CharField
    product = models.ForeignKey(
        MinistryProduct,
        on_delete=models.PROTECT,   # never lose price history
        related_name="official_prices",
        
    )

    region = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g. 'north', 'south'. Leave blank for national or specific wilaya.",
    )
    wilaya = models.CharField(
        max_length=100,
        blank=True,
        help_text="Empty = national or region-wide price.",
    )

    min_price = models.DecimalField(max_digits=10, decimal_places=2)
    max_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default="kg")

    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField(null=True, blank=True)
    set_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-valid_from"]
        indexes = [
            models.Index(fields=["product", "wilaya", "region"]),
            models.Index(fields=["valid_from"]),
        ]

    def clean(self):
        if self.min_price > self.max_price:
            raise ValidationError("min_price must be <= max_price.")
        if self.valid_until and self.valid_from > self.valid_until:
            raise ValidationError("valid_from must be before valid_until.")

    @property
    def is_active(self):
        now = timezone.now()
        return self.valid_from <= now and (
            self.valid_until is None or self.valid_until >= now
        )

    def save(self, *args, **kwargs):
        if self.wilaya:
            calculated_region = get_region_from_wilaya(self.wilaya)
            if calculated_region:
                self.region = calculated_region
        super().save(*args, **kwargs)