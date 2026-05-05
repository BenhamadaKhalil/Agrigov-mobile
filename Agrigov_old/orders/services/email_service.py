import os
import requests
import base64


def send_invoice_email(user_email, pdf_buffer, order_id):
    try:
        pdf_base64 = base64.b64encode(pdf_buffer.getvalue()).decode()

        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {os.getenv("RESEND_API_KEY")}",
                "Content-Type": "application/json",
            },
            json={
                "from": "AGRIGOV <onboarding@resend.dev>",
                "to": [user_email],
                "subject": f"Invoice #{order_id}",
                "html": f"""
                    <h2>Thank you for your order</h2>
                    <p>Your invoice #{order_id} is attached.</p>
                """,
                "attachments": [
                    {
                        "filename": f"invoice_{order_id}.pdf",
                        "content": pdf_base64,
                    }
                ],
            },
        )

        if response.status_code >= 400:
            print("Resend error:", response.text)

    except Exception as e:
        print("Email failed:", str(e))