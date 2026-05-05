import cloudinary.uploader

def upload_invoice_to_cloudinary(pdf_buffer, order_id):
    result = cloudinary.uploader.upload(
        pdf_buffer,
        resource_type="raw",
        folder="AGRIGOV/invoices",
        public_id=f"invoice_{order_id}"
    )

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }