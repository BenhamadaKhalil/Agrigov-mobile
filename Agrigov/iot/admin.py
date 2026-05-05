from django.contrib import admin
from .models import IoTDevice, SensorData, AlertThreshold, Alert


@admin.register(IoTDevice)
class IoTDeviceAdmin(admin.ModelAdmin):
    list_display = ['device_id', 'farm', 'device_type', 'is_active', 'last_seen']
    list_filter = ['is_active', 'device_type']
    search_fields = ['device_id', 'farm__name']


@admin.register(SensorData)
class SensorDataAdmin(admin.ModelAdmin):
    list_display = ['device', 'temperature', 'humidity', 'soil_moisture', 'recorded_at']
    list_filter = ['recorded_at']
    date_hierarchy = 'recorded_at'


@admin.register(AlertThreshold)
class AlertThresholdAdmin(admin.ModelAdmin):
    list_display = ['farm', 'temp_min', 'temp_max', 'humidity_min', 'humidity_max', 'soil_min', 'soil_max']
    list_filter = ['farm']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['farm', 'alert_type', 'severity', 'message', 'is_resolved', 'created_at']
    list_filter = ['alert_type', 'severity', 'is_resolved']