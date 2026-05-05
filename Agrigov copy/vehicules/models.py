from django.db import models
from users.models import User
# Create your models here.
class Vehicle(models.Model):
    transporter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="vehicles",
        limit_choices_to={"role": "TRANSPORTER"}
    )

    type = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    capacity = models.FloatField()

    def __str__(self):
        return f"{self.type} - {self.model}"