from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO


def generate_invoice_pdf(order):
    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)
    styles = getSampleStyleSheet()

    elements = []

    elements.append(Paragraph(f"Invoice #{order.id}", styles["Title"]))
    elements.append(Spacer(1, 10))


    elements.append(Paragraph(f"Buyer: {order.buyer}", styles["Normal"]))
    elements.append(Paragraph(f"Farm: {order.farm}", styles["Normal"]))
    elements.append(Paragraph(f"Status: {order.status}", styles["Normal"]))
    elements.append(Paragraph(f"Date: {order.created_at}", styles["Normal"]))
    elements.append(Spacer(1, 15))


    data = [["Product", "Price (DZD)", "Quantity", "Total (DZD)"]]

    for item in order.items.all():
        product = item.product_item

        data.append([
            product.title,
            str(product.unit_price),
            str(item.quantity),
            str(item.total_price)
        ])

    # TOTAL ROW
    data.append(["", "", "Total:", str(order.total_price)])


    table = Table(data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

        ("GRID", (0, 0), (-1, -1), 1, colors.black),

        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ]))

    elements.append(table)
    
    # BUILD PDF
    doc.build(elements)

    buffer.seek(0)
    return buffer