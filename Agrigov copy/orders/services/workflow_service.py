from .invoice_service import generate_invoice_pdf
from .cloudinary_service import upload_invoice_to_cloudinary
from .email_service import send_invoice_email
from orders.models import Invoice


def handle_invoice_generation(order):
    try:
        pdf_buffer = generate_invoice_pdf(order)
        
        pdf_buffer.seek(0)
        upload_result = upload_invoice_to_cloudinary(pdf_buffer, order.id)
        print(f"Cloudinary Upload Success: {upload_result['url']}")

        Invoice.objects.create(
            order=order,
            pdf_url=upload_result["url"],
            public_id=upload_result["public_id"]
        )
        
        pdf_buffer.seek(0)
        user_email = order.buyer.user.email
        send_invoice_email(user_email, pdf_buffer, order.id)
        print("Email Sent Successfully")

    except Exception as e:
        print(f"INVOICE PIPELINE FAILED: {str(e)}")