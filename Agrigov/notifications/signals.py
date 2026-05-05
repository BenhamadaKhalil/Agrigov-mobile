from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from orders.models import Order
from missions.models import Mission
from official_prices.models import OfficialPrice
from users.models import FarmerProfile, TransporterProfile

User = get_user_model()


def create_notification(recipient, notification_type, title, message, data=None):
    from .models import Notification
    Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {}
    )


# ─── Order Signals ──────────────────────────────────────────────
@receiver(post_save, sender=Order)
def order_notification(sender, instance, created, **kwargs):
    if created:
        # Order Placed → Notify Farmer
        create_notification(
            recipient=instance.farm.farmer,
            notification_type='order_placed',
            title='New Order Received',
            message=f'New order #{instance.id} from {instance.buyer.user.email}',
            data={'order_id': instance.id}
        )


# ─── Mission Signals ────────────────────────────────────────────
@receiver(post_save, sender=Mission)
def mission_notification(sender, instance, created, **kwargs):
    if created:
        # Mission Created → Notify Transporters in same wilaya
        transporters = User.objects.filter(
            role='TRANSPORTER',
            transporter_profile__wilaya=instance.wilaya
        )
        for transporter in transporters:
            create_notification(
                recipient=transporter,
                notification_type='mission_created',
                title='New Mission Available',
                message=f'New mission: Order #{instance.order.id} from {instance.wilaya}',
                data={'mission_id': instance.id}
            )
    else:
        # Mission Status Changed → Notify Farmer and Buyer
        if instance.status == 'accepted':
            create_notification(
                recipient=instance.order.farm.farmer,
                notification_type='mission_accepted',
                title='Mission Accepted',
                message=f'Mission #{instance.id} has been accepted',
                data={'mission_id': instance.id}
            )
        elif instance.status == 'delivered':
            create_notification(
                recipient=instance.order.farm.farmer,
                notification_type='order_delivered',
                title='Order Delivered',
                message=f'Order #{instance.order.id} has been delivered',
                data={'order_id': instance.order.id}
            )
            create_notification(
                recipient=instance.order.buyer.user,
                notification_type='order_delivered',
                title='Order Delivered',
                message=f'Your order #{instance.order.id} has been delivered',
                data={'order_id': instance.order.id}
            )