from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model

from official_prices.models import OfficialPrice
from orders.models import Order
from farms.models import Farm
from products.models import MinistryProduct, Product

from .serializers import HomepageResponseSerializer

User = get_user_model()


class HomepageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # ── Stats ──────────────────────────────────────────────
        total_farmers = User.objects.filter(role=User.ROLE_FARMER, is_verified=True).count()
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(
            status__in=["delivered", "confirmed"]
        ).aggregate(revenue=Sum("total_price"))["revenue"] or 0
        total_products = Product.objects.filter(in_stock=True).count()
        wilayas_count = Farm.objects.values("wilaya").distinct().count()
        total_transporters = User.objects.filter(role=User.ROLE_TRANSPORTER, is_verified=True).count()
        total_buyers = User.objects.filter(role=User.ROLE_BUYER, is_verified=True).count()

        stats = {
            "total_farmers": total_farmers,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "total_products": total_products,
            "wilayas_count": wilayas_count,
            "total_transporters": total_transporters,
            "total_buyers": total_buyers,
        }

        # ── Ticker ─────────────────────────────────────────────
        ticker = self._build_ticker()

        # ── Prices (latest per product, no DISTINCT ON) ────────
        # Get all active prices, ordered by product and then most recent first
        all_active = OfficialPrice.objects.filter(
            Q(valid_until__isnull=True) | Q(valid_until__gte=timezone.now())
        ).select_related("product").order_by("product", "-valid_from")

        # Python deduplication – keep first (most recent) for each product
        price_map = {}
        for p in all_active.iterator():
            if p.product_id not in price_map:
                price_map[p.product_id] = p
            if len(price_map) >= 10:      # limit to 10 products
                break

        prices = []
        for p in price_map.values():
            name = p.product.name if p.product else "Unknown"
            prices.append({
                "id": p.id,
                "commodity": name,
                "region": p.wilaya or "National",
                "unit": p.unit,
                "min_price": float(p.min_price),
                "max_price": float(p.max_price),
                "price": f"{p.min_price} – {p.max_price} DZD",
                "change": "– 0.0%",
                "changePct": "0.0",
                "trend": "flat",
            })

        # ── News (static) ─────────────────────────────────────
        news = [
            # ... keep the existing three articles unchanged ...
            {
                "id": "featured",
                "featured": True,
                "category": "Featured",
                "title": "Digital Farming Subsidy Program Launch",
                "excerpt": "The Ministry announces a new grant for small-scale farmers adopting IoT and digital tracking tools for improved yield.",
                "ctaLabel": "Read Full Story",
                "href": "#",
                "imageUrl": "https://lh3.googleusercontent.com/aida-public/...",
                "imageAlt": "Person inspecting plants in a greenhouse with tablet",
            },
            {
                "id": "el-nino",
                "featured": False,
                "date": "Oct 24, 2023",
                "category": "Weather Alert",
                "title": "El Niño Preparedness Guidelines",
                "excerpt": "Updated guidelines for water harvesting and crop protection for the upcoming rainy season.",
                "ctaLabel": "Download Guide",
                "href": "#",
            },
            {
                "id": "coffee",
                "featured": False,
                "date": "Oct 22, 2023",
                "category": "Market Trend",
                "title": "Coffee Exports Rise by 15%",
                "excerpt": "Quarterly report shows strong international demand for local Arabica coffee beans.",
                "ctaLabel": "View Report",
                "href": "#",
            },
        ]

        response_data = {
            "stats": stats,
            "ticker": ticker,
            "prices": prices,
            "news": news,
        }

        serializer = HomepageResponseSerializer(data=response_data)
        serializer.is_valid(raise_exception=True)

        return Response({
            "status": "success",
            "code": 200,
            "data": serializer.data,
        })

    def _build_ticker(self):
        EMOJI_MAP = {
            "Maize": "🌽", "Carrots": "🥕", "Rice": "🍚", "Tomatoes": "🍅",
            "Potatoes": "🥔", "Onions": "🧅", "Soybeans": "🌱", "Coffee": "☕",
            "Wheat": "🌾",
        }
        products = MinistryProduct.objects.filter(is_active=True)[:6]
        ticker = []

        for prod in products:
            current = OfficialPrice.objects.filter(
                Q(valid_until__isnull=True) | Q(valid_until__gte=timezone.now()),
                product=prod
            ).order_by("-valid_from").first()

            if not current:
                continue

            avg_price = (current.min_price + current.max_price) / 2
            emoji = EMOJI_MAP.get(prod.name, "📦")
            trend = "flat"
            previous = OfficialPrice.objects.filter(
                product=prod, valid_from__lt=current.valid_from
            ).order_by("-valid_from").first()
            if previous:
                prev_avg = (previous.min_price + previous.max_price) / 2
                if avg_price > prev_avg:
                    trend = "up"
                elif avg_price < prev_avg:
                    trend = "down"

            ticker.append({
                "emoji": emoji,
                "label": prod.name,
                "price": f"{avg_price:.2f} DZD/{current.unit}",
                "trend": trend,
            })

        return ticker