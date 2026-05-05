from django.utils import timezone
from django.db.models import Q
from .models import OfficialPrice
from regions.utils import get_region_from_wilaya

# 1. Ensure you have the helper defined
def normalize_name(name: str) -> str:
    if not name:
        return ""
    return " ".join(name.split()).lower()

def get_active_price(ministry_product_id: int, wilaya: str = ""):
    """
    Returns the most specific active OfficialPrice for a MinistryProduct.
    Priority: exact wilaya > broad region > national
    """
    now = timezone.now()

    # FIX: Use 'wilaya' (which exists in your arguments) instead of 'product_name'
    if wilaya:
        wilaya = normalize_name(wilaya)

    base_qs = OfficialPrice.objects.filter(
        product_id=ministry_product_id,
        valid_from__lte=now,
    ).filter(
        Q(valid_until__isnull=True) | Q(valid_until__gte=now)
    ).order_by("-valid_from") 

def get_active_price(ministry_product_id: int, wilaya: str = ""):
    now = timezone.now()

    if wilaya:
        wilaya = normalize_name(wilaya)

    base_qs = OfficialPrice.objects.filter(
        product_id=ministry_product_id,
        valid_from__lte=now,
    ).filter(
        Q(valid_until__isnull=True) | Q(valid_until__gte=now)
    ).order_by("-valid_from")

    if wilaya:
        exact = base_qs.filter(wilaya__iexact=wilaya).first()
        if exact:
            return exact

        region_name = get_region_from_wilaya(wilaya)
        if region_name:
            regional = base_qs.filter(region__iexact=region_name).first()
            if regional:
                return regional

    national = base_qs.filter(wilaya="", region="").first()
    if national:
        return national

    return base_qs.first()


def validate_price(ministry_product_id: int, price, wilaya: str = ""):
    """
    Returns (is_valid: bool, price_range: OfficialPrice | None, message: str)
    """
    price_range = get_active_price(ministry_product_id, wilaya)

    if not price_range:
        return False, None, "No official price defined for this product."

    if not (price_range.min_price <= price <= price_range.max_price):
        return False, price_range, (
            f"Price must be between {price_range.min_price} "
            f"and {price_range.max_price} {price_range.unit}."
        )

    return True, price_range, "Valid price."


def expire_old_price(ministry_product_id: int, wilaya: str = "", region: str = ""):
    """Sets valid_until=now for the active price before inserting a new one."""
    now = timezone.now()
    OfficialPrice.objects.filter(
        product_id=ministry_product_id,
        wilaya=wilaya,
        region=region,
        valid_from__lte=now,
    ).filter(
        Q(valid_until__isnull=True) | Q(valid_until__gte=now)
    ).update(valid_until=now)
