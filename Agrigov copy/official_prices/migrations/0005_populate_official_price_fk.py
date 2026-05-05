from django.db import migrations


def forward(apps, schema_editor):
    # Data was already migrated manually via shell
    pass


def backward(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("official_prices", "0004_add_product_fk_nullable"),
        ("products", "0005_remove_product_title_alter_product_category_and_more"),
    ]

    operations = [
        migrations.RunPython(forward, backward),
    ]