from django.db import models
from orders.models import Order
from users.models import User
from vehicules.models import Vehicle


class Mission(models.Model):

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"     
    STATUS_PICKED_UP = "picked_up"    
    STATUS_IN_TRANSIT = "in_transit"  
    STATUS_DELIVERED = "delivered"    
    STATUS_CANCELLED = "cancelled"    

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_PICKED_UP, "Picked Up"),
        (STATUS_IN_TRANSIT, "In Transit"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    VALID_TRANSITIONS = {
        STATUS_PENDING: [STATUS_ACCEPTED, STATUS_CANCELLED],
        STATUS_ACCEPTED: [STATUS_PICKED_UP, STATUS_CANCELLED],
        STATUS_PICKED_UP: [STATUS_IN_TRANSIT],
        STATUS_IN_TRANSIT: [STATUS_DELIVERED],
        STATUS_DELIVERED: [],
        STATUS_CANCELLED: [],
    }

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="mission"
    )

    transporter = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="missions",
        limit_choices_to={"role": "TRANSPORTER"}
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="missions"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True
    )

    wilaya = models.CharField(max_length=100)
    baladiya = models.CharField(max_length=100, blank=True)

    pickup_address = models.TextField(blank=True)
    delivery_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    # ✅ ADD COORDINATES FIELDS
    pickup_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    pickup_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    accepted_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mission #{self.id} — Order #{self.order.id} [{self.status}]"

    def can_transition(self, new_status):
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])


class MissionDecline(models.Model):
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="declines"
    )
    transporter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="declined_missions",
        limit_choices_to={"role": "TRANSPORTER"}
    )
    declined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("mission", "transporter")

    def __str__(self):
        return f"{self.transporter.email} declined Mission #{self.mission.id}"