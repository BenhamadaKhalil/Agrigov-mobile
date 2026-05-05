from .models import Region
def get_region_from_wilaya(wilaya):
    """Returns region name for a given wilaya. Case-insensitive."""
    if not wilaya:
        return ''
    
    # Standardize input to lowercase and remove spaces
    search_wilaya = wilaya.strip().lower()
    
    for region in Region.objects.all():
        # Compare against a lowercase version of the list in the database
        if search_wilaya in [w.lower() for w in region.wilayas]:
            return region.name
    return ''

def get_wilayas_by_region(region_name):
    """Returns list of wilayas for a given region."""
    try:
        return Region.objects.get(name=region_name).wilayas
    except Region.DoesNotExist:
        return []

def get_all_regions():
    """Returns list of all regions with their wilayas"""
    return [
        {
            'name': region.get_name_display(),
            'code': region.name,
            'wilayas': region.wilayas
        }
        for region in Region.objects.all()
    ]