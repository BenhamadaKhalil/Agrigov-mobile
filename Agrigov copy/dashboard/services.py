from datetime import timedelta, timezone
from django.db.models import Q, Avg, F, Max, Min, Sum

from missions.models import Mission
from orders.models import Order, OrderItem
from products.models import Product
from reviews.models import Review
from users.models import TransporterProfile
from official_prices.models import OfficialPrice
from regions.services import get_region_comparison
from django.db.models.functions import TruncDay, TruncMonth
from django.db.models import Count

class DashboardService:

    @staticmethod
    def get_farmer_dashboard(user):
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        products = Product.objects.filter(farm__farmer=user)

        order_items = OrderItem.objects.filter(
            product_item__product__farm__farmer=user
        )

        delivered_items = order_items.filter(order__status='delivered')

        # ───────────────
        # BASIC METRICS
        # ───────────────
        total_revenue = delivered_items.aggregate(
            total=Sum(F('product_item__unit_price') * F('quantity'))
        )['total'] or 0

        previous_30_days = now - timedelta(days=60)

        prev_revenue = delivered_items.filter(
            order__created_at__range=(previous_30_days, last_30_days)
        ).aggregate(
            total=Sum(F('product_item__unit_price') * F('quantity'))
        )['total'] or 0

        revenue_growth = (
            ((total_revenue - prev_revenue) / prev_revenue) * 100
            if prev_revenue > 0 else 0
        )

        avg_rating = products.aggregate(avg=Avg('average_rating'))['avg'] or 0
        
        # ───────────────
        # 📈 REVENUE CHART (daily)
        # ───────────────
        revenue_chart = (
            delivered_items
            .filter(order__created_at__gte=last_30_days)
            .annotate(day=TruncDay('order__created_at'))
            .values('day')
            .annotate(total=Sum(F('product_item__unit_price') * F('quantity')))
            .order_by('day')
        )

        # ───────────────
        # 📦 ORDERS CHART
        # ───────────────
        orders_chart = (
            order_items
            .filter(order__created_at__gte=last_30_days)
            .annotate(day=TruncDay('order__created_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        # ───────────────
        # 🥧 CATEGORY DISTRIBUTION
        # ───────────────
        category_distribution = (
            order_items
            .values('product_item__category_name')
            .annotate(total=Sum('quantity'))
            .order_by('-total')
        )

        # ───────────────
        # 🔥 TOP PRODUCTS
        # ───────────────
        top_products = (
            products.annotate(total_sold=Sum('history_items__order_items__quantity'))
            .order_by('-total_sold')[:5]
            .values('id', 'ministry_product__name', 'total_sold')
        )

        return {
            "overview": {
                "total_revenue": total_revenue,
                "revenue_growth": round(revenue_growth, 2),
                "total_products": products.count(),
                "avg_rating": round(avg_rating, 2),
            },

            "charts": {
                "revenue_over_time": list(revenue_chart),
                "orders_over_time": list(orders_chart),
                "category_distribution": list(category_distribution),
            },

            "insights": {
                "top_products": list(top_products),
                "low_stock_products": products.filter(stock__lt=10).count(),
            }
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
        
        from django.db.models.functions import TruncMonth
        # 📈 Spending over time
        spending_chart = (
            orders.filter(status='delivered')
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Sum('total_price'))
            .order_by('month')
        )

        # 🥧 Status distribution
        status_distribution = (
            orders.values('status')
            .annotate(count=Count('id'))
        )


        return {
            "overview": {
                "total_orders": total_orders,
                "total_spent": total_spent,
                "avg_order_value": round(avg_order_value, 2),
                "total_reviews": total_reviews,
            },
            "recent_activity": list(recent_orders),
            "charts": {
                "spending_over_time": list(spending_chart),
                "status_distribution": list(status_distribution),
            }
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
        
        from django.db.models.functions import TruncDay
        missions = Mission.objects.filter(transporter=user)

        # 📈 Deliveries over time
        deliveries_chart = (
            missions.filter(status='delivered')
            .annotate(day=TruncDay('delivered_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        # ⚡ Avg delivery time
        avg_delivery_time = missions.filter(
            status='delivered',
            accepted_at__isnull=False,
            delivered_at__isnull=False
        ).annotate(
            duration=F('delivered_at') - F('accepted_at')
        ).aggregate(avg=Avg('duration'))['avg']

        return {
            "overview": {
                "total_deliveries": total_deliveries,
                "active_deliveries": active_deliveries,
                "completion_rate": round(completion_rate, 2),
            },
            "recent_activity": list(recent_deliveries),
            "charts": {
            "deliveries_over_time": list(deliveries_chart),
        },
        "performance": {
            "avg_delivery_time": avg_delivery_time,
        }
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
        
        from django.db.models.functions import TruncMonth

        now = timezone.now()
        last_6_months = now - timedelta(days=180)

        # 📈 Revenue trend
        revenue_trend = (
            Order.objects.filter(status='delivered', created_at__gte=last_6_months)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Sum('total_price'))
            .order_by('month')
        )

        # 🌍 Region comparison
        region_data = (
            Order.objects.values('farm__wilaya')
            .annotate(total=Sum('total_price'))
            .order_by('-total')
        )

        # 🥧 User roles distribution
        from django.contrib.auth import get_user_model
        User = get_user_model()

        role_distribution = (
            User.objects.values('role')
            .annotate(count=Count('id'))
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
                "reveue_data": revenue_data['total'] or 0,
                "price_stats": {
                    "max_price": price_stats['max_p'] or 0,
                    "min_price": price_stats['min_p'] or 0,
                }
            },
            "recent_activity": {
                "recent_users": list(recent_users),
            },
            "charts": {
                "revenue_trend": list(revenue_trend),
                "region_performance": list(region_data),
                "user_distribution": list(role_distribution),
            }
        }
