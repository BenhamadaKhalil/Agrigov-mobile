from django.contrib import admin
from .models import Mission, MissionDecline


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = [
        "id", "order", "transporter", "vehicle",
        "wilaya", "baladiya", "status",
        "accepted_at", "delivered_at", "created_at"
    ]
    list_filter = ["status", "wilaya"]
    search_fields = ["order__id", "transporter__email", "wilaya", "baladiya"]
    readonly_fields = [
        "wilaya", "baladiya",
        "accepted_at", "picked_up_at", "delivered_at",
        "created_at", "updated_at"
    ]


@admin.register(MissionDecline)
class MissionDeclineAdmin(admin.ModelAdmin):
    list_display = ["mission", "transporter", "declined_at"]
    list_filter = ["declined_at"]
    search_fields = ["mission__id", "transporter__email"]