from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Notification(models.Model):
    TYPE_CHOICES = [
        ('order_placed', 'Order Placed'),
        ('order_confirmed', 'Order Confirmed'),
        ('order_delivered', 'Order Delivered'),
        ('mission_created', 'Mission Created'),
        ('mission_accepted', 'Mission Accepted'),
        ('mission_status', 'Mission Status Update'),
        ('price_changed', 'Price Changed'),
        ('user_validated', 'User Validated'),
        ('user_rejected', 'User Rejected'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)  # Extra data (order_id, mission_id, etc.)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} for {self.recipient.email}"