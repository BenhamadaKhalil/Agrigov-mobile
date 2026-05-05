import cloudinary.utils

def build_cloudinary_url(resource):
    if not resource:
        return None

    if isinstance(resource, str):
        public_id = resource
    else:
        # CloudinaryResource object
        public_id = resource.public_id

    url, _ = cloudinary.utils.cloudinary_url(public_id)
    return url