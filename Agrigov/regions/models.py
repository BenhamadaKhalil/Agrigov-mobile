from django.db import models


class Region(models.Model):
    """
    Algeria regions for agricultural data aggregation
    """
    REGION_CHOICES = [
        ('north', 'North'),
        ('east', 'East'),
        ('west', 'West'),
        ('south', 'South'),
    ]

    name = models.CharField(max_length=20, choices=REGION_CHOICES, unique=True)
    wilayas = models.JSONField(default=list, help_text="List of wilayas in this region")

    def __str__(self):
        return self.get_name_display()

    class Meta:
        verbose_name = "Region"
        verbose_name_plural = "Regions"