from django.db import models
from django.utils.text import slugify
from farms.models import Farm
from cloudinary.models import CloudinaryField
from categories.models import Category


# ─────────────────────────────────────────────
#  MinistryProduct  (defined by the admin/ministry)
# ─────────────────────────────────────────────
class MinistryProduct(models.Model):
    """
    Official product catalogue managed exclusively by the Ministry (admin).
    Farmers may only list products that exist here.
    """
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ministry_products",
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────
#  Product  (farmer listing — must reference a MinistryProduct)
# ─────────────────────────────────────────────
class Product(models.Model):
    SEASON_CHOICES = [
        ("winter", "Winter"),
        ("spring", "Spring"),
        ("summer", "Summer"),
        ("fall", "Fall"),
    ]

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="products",
    )


    ministry_product = models.ForeignKey(
                    MinistryProduct,
                    on_delete=models.PROTECT,
                    related_name="farm_listings",
                    null=True,      # ← add this
                    blank=True,     # ← add this
    )

    description = models.TextField()
    season = models.CharField(max_length=20, choices=SEASON_CHOICES)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    in_stock = models.BooleanField(default=True)

    # category is kept for filtering; auto-synced from ministry_product.category
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )

    average_rating = models.FloatField(default=0)
    review_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.in_stock = self.stock > 0
        # auto-sync category from the ministry product
        if self.ministry_product_id and not self.category_id:
            self.category = self.ministry_product.category
        super().save(*args, **kwargs)

    def __str__(self):
        return self.ministry_product.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = CloudinaryField(
        "product_image",
        folder="AGRIGOV/products",
        transformation={"quality": "auto", "fetch_format": "auto"},
    )

    def __str__(self):
        return f"Image for {self.product.ministry_product.name}"