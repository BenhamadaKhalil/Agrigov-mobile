from datetime import timedelta, timezone

from django.db.models import Avg, F, Sum

from orders.models import Order, OrderItem
from products.models import Product
from reviews.models import Review
from users.models import TransporterProfile
from official_prices.models import OfficialPrice
from regions.services import get_region_comparison

class DashboardService:

    @staticmethod
    def get_farmer_dashboard(user):
        from django.utils import timezone
        from datetime import timedelta
        products = Product.objects.filter(farm__farmer=user)

        order_items = OrderItem.objects.filter(
            product_item__product__farm__farmer=user
        )

        delivered_items = order_items.filter(order__status='delivered')

        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        total_products = products.count()

        total_orders = order_items.count()

        total_revenue = delivered_items.aggregate(
            total=Sum(F('product_item__unit_price') * F('quantity'))
        )['total'] or 0

        monthly_revenue = delivered_items.filter(
            order__created_at__gte=last_30_days
        ).aggregate(
            total=Sum(F('product_item__unit_price') * F('quantity'))
        )['total'] or 0

        avg_rating = products.aggregate(avg=Avg('average_rating'))['avg'] or 0

        top_products_raw = (
            products.annotate(total_sold=Sum('history_items__order_items__quantity'))
            .order_by('-total_sold')[:5]
            .values('id', 'ministry_product__name', 'total_sold')
        )
        
        top_products = [
            {
                'id': p['id'],
                'title': p['ministry_product__name'],
                'total_sold': p['total_sold'] or 0
            }
            for p in top_products_raw
        ]

        low_stock = products.filter(stock__lt=10).count()

        recent_orders = Order.objects.filter(
            items__product_item__product__farm__farmer=user
        ).distinct().order_by('-created_at')[:5].values('id', 'status', 'created_at')

        return {
            "overview": {
                "total_products": total_products,
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "monthly_revenue": monthly_revenue,
                "average_rating": round(avg_rating, 2),
            },
            "insights": {
                "top_products": list(top_products),
                "low_stock_products": low_stock,
            },
            "recent_activity": list(recent_orders),
        }
    @staticmethod
    def get_buyer_dashboard(user):
        buyer = user.buyer_profile

        orders = Order.objects.filter(buyer=buyer)

        delivered_orders = orders.filter(status='delivered')

        total_orders = orders.count()

        total_spent = delivered_orders.aggregate(
            total=Sum('total_price')
        )['total'] or 0

        avg_order_value = (
            total_spent / total_orders if total_orders > 0 else 0
        )

        total_reviews = Review.objects.filter(buyer=buyer).count()

        # 🕒 RECENT ORDERS
        recent_orders = orders.order_by('-created_at')[:5].values(
            'id', 'status', 'total_price', 'created_at'
        )

        return {
            "overview": {
                "total_orders": total_orders,
                "total_spent": total_spent,
                "avg_order_value": round(avg_order_value, 2),
                "total_reviews": total_reviews,
            },
            "recent_activity": list(recent_orders),
        }

    @staticmethod
    def get_transporter_dashboard(user):
        orders = Order.objects.filter(mission__isnull=False, mission__transporter=user)

        total_deliveries = orders.filter(status='delivered').count()

        active_deliveries = orders.filter(status='shipped').count()

        total_orders = orders.count()

        completion_rate = (
            (total_deliveries / total_orders) * 100 if total_orders > 0 else 0
        )

        recent_deliveries = orders.order_by('-created_at')[:5].values(
            'id', 'status', 'created_at'
        )

        return {
            "overview": {
                "total_deliveries": total_deliveries,
                "active_deliveries": active_deliveries,
                "completion_rate": round(completion_rate, 2),
            },
            "recent_activity": list(recent_deliveries),
        }

    @staticmethod
    def get_admin_dashboard():
        """National Ministry Dashboard."""
        from django.contrib.auth import get_user_model
        from django.utils import timezone
        from datetime import timedelta

        User = get_user_model()
        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        active_prices = OfficialPrice.objects.filter(
            Q(valid_until__isnull=True) | Q(valid_until__gte=now),
            valid_from__lte=now
        )

        revenue_data = Order.objects.filter(status='delivered').aggregate(total=Sum('total_price'))
        price_stats = active_prices.aggregate(max_p=Max('max_price'), min_p=Min('min_price'))

        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        total_users = User.objects.count()
        new_users = User.objects.filter(created_at__gte=last_30_days).count()

        total_orders = Order.objects.count()

        total_revenue = Order.objects.filter(
            status='delivered'
        ).aggregate(total=Sum('total_price'))['total'] or 0

        monthly_revenue = Order.objects.filter(
            status='delivered',
            created_at__gte=last_30_days
        ).aggregate(total=Sum('total_price'))['total'] or 0

        recent_users = User.objects.order_by('-created_at')[:5].values(
            'id', 'email', 'role', 'created_at'
        )

        return {
            "overview": {
                "total_users": total_users,
                "new_users_last_30_days": new_users,
                "total_products": Product.objects.count(),
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "monthly_revenue": monthly_revenue,
                "total_reviews": Review.objects.count(),
            },
            "recent_activity": {
                "recent_users": list(recent_users),
            }
        }
