from django.db.models import Count, Sum, F, Q
from django.core.exceptions import ObjectDoesNotExist
from .models import Region
from orders.models import Order, OrderItem
from users.models import User
from missions.models import Mission
from official_prices.models import OfficialPrice
from .utils import get_region_from_wilaya
def get_region_stats(region_name):
    
    """Get all statistics for a region"""
    try:
        region = Region.objects.get(name=region_name)
    except ObjectDoesNotExist:
        raise ValueError(f"Region '{region_name}' does not exist.")
    
    wilayas = region.wilayas
    
    # User Counts
    farmers_count = User.objects.filter(role="FARMER", farmer_profile__wilaya__in=wilayas).count()
    active_farmers = User.objects.filter(role="FARMER", farmer_profile__wilaya__in=wilayas, farm__products__isnull=False).distinct().count()
    transporters_count = User.objects.filter(role="TRANSPORTER", transporter_profile__wilaya__in=wilayas).count()
    
    # FIXED: Now filters buyers by wilaya
    buyers_count = User.objects.filter(role="BUYER", buyer_profile__wilaya__in=wilayas).count()
    
    # Orders & Revenue
    region_orders = Order.objects.filter(farm__wilaya__in=wilayas)
    orders_count = region_orders.count()
    revenue = region_orders.filter(status="delivered").aggregate(total=Sum('total_price'))['total'] or 0
    
    # Missions
    completed_missions = Mission.objects.filter(order__farm__wilaya__in=wilayas, status="delivered").count()
    
    # Top Products
    top_products = OrderItem.objects.filter(order__farm__wilaya__in=wilayas).values(
        'product__title'
    ).annotate(
        total_quantity=Sum('quantity'),
        total_value=Sum('price')
    ).order_by('-total_value')[:5]
    
    return {
        "region": region.get_name_display(),
        "wilayas": wilayas,
        "farmers": {"total": farmers_count, "active": active_farmers},
        "transporters": transporters_count,
        "buyers": buyers_count,
        "orders": {"total": orders_count, "revenue": revenue},
        "missions": {"completed": completed_missions},
        "top_products": list(top_products),
    }

def get_all_regions_stats():
    """Get statistics for all regions"""
    # Much cleaner way to build the dictionary
    return {region.name: get_region_stats(region.name) for region in Region.objects.all()}

def get_region_comparison():
    """
    Ministry-Grade Regional Analysis.
    Fixes the 'price' FieldError by using 'product_item__unit_price'.
    """
    
    # 1. Get Official Prices grouped by Wilaya
    price_stats = OfficialPrice.objects.exclude(wilaya='').values('wilaya').annotate(
        total_prices=Count('id')
    )

    # 2. Get Sales grouped by Wilaya
    # PATH: OrderItem -> product_item (Product) -> unit_price
    sales_stats = OrderItem.objects.filter(
        order__status='delivered'
    ).values(
        wilaya_name=F('product_item__product__farm__wilaya')
    ).annotate(
        # FIX: Changed 'price' to 'product_item__unit_price'
        revenue=Sum(F('product_item__unit_price') * F('quantity')),
        orders_count=Count('order', distinct=True)
    ).exclude(wilaya_name=None)

    # 3. Combine and Map to Regions
    combined = {
        "north": {"region": "north", "total_active_prices": 0, "revenue": 0.0, "order_count": 0},
        "south": {"region": "south", "total_active_prices": 0, "revenue": 0.0, "order_count": 0},
        "east": {"region": "east", "total_active_prices": 0, "revenue": 0.0, "order_count": 0},
        "west": {"region": "west", "total_active_prices": 0, "revenue": 0.0, "order_count": 0},
    }

    for p in price_stats:
        reg = get_region_from_wilaya(p['wilaya'])
        if reg in combined:
            combined[reg]["total_active_prices"] += p['total_prices']

    for s in sales_stats:
        reg = get_region_from_wilaya(s['wilaya_name'])
        if reg in combined:
            combined[reg]["revenue"] += float(s['revenue'] or 0)
            combined[reg]["order_count"] += s['orders_count']

    return list(combined.values())