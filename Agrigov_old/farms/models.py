from django.db import models
from django.conf import settings

# Import the utility!
from regions.utils import get_region_from_wilaya

User = settings.AUTH_USER_MODEL

class Farm(models.Model):
    farmer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="farms"
    )

    name = models.CharField(max_length=255)
    wilaya = models.CharField(max_length=100)
    baladiya = models.CharField(max_length=100)
    farm_size = models.FloatField()
    address = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.farmer.email}"

    # ADD THIS AT THE BOTTOM:
    @property
    def region(self):
        if self.wilaya:
            return get_region_from_wilaya(self.wilaya)
        return "Unknown"