# cart/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import BuyerProfile
from .models import Cart

@receiver(post_save, sender=BuyerProfile)
def create_cart_for_new_buyer(sender, instance, created, **kwargs):
    """
    Automatically create a Cart whenever a new BuyerProfile is created.
    """
    if created:
        Cart.objects.create(buyer=instance)