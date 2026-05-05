from django.db import models
from django.utils import timezone
from farms.models import Farm
from users.models import User


class IoTDevice(models.Model):
    """IoT device installed on a farm"""
    DEVICE_TYPES = [
        ('dht11', 'DHT11 Temperature/Humidity'),
        ('soil', 'Soil Moisture Sensor'),
        ('combined', 'Combined Sensor'),
    ]
    
    device_id = models.CharField(max_length=100, unique=True)
    mac_address = models.CharField(max_length=17, null=True, blank=True, help_text="ESP32 MAC address (XX:XX:XX:XX:XX:XX)")
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='iot_devices')
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default='combined')
    is_active = models.BooleanField(default=True)
    is_recording = models.BooleanField(default=False)  # ← ADD THIS
    installed_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.device_id} - {self.farm.name}"
    
    class Meta:
        ordering = ['-installed_at']


class SensorData(models.Model):
    """Sensor readings from IoT devices"""
    device = models.ForeignKey(IoTDevice, on_delete=models.CASCADE, related_name='readings')
    
    temperature = models.FloatField(null=True, blank=True, help_text="Temperature in Celsius")
    humidity = models.FloatField(null=True, blank=True, help_text="Humidity in %")
    soil_moisture = models.IntegerField(null=True, blank=True, help_text="Soil moisture in %")
    
    battery_level = models.IntegerField(null=True, blank=True, help_text="Battery level %")
    signal_strength = models.IntegerField(null=True, blank=True, help_text="WiFi signal strength")
    
    recorded_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.device.device_id} - {self.recorded_at}"
    
    class Meta:
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['device', '-recorded_at']),
            models.Index(fields=['recorded_at']),
        ]


class AlertThreshold(models.Model):
    """Thresholds for alerts"""
    farm = models.OneToOneField(Farm, on_delete=models.CASCADE, related_name='alert_thresholds')
    
    temp_min = models.FloatField(default=10, help_text="Minimum temperature in Celsius")
    temp_max = models.FloatField(default=35, help_text="Maximum temperature in Celsius")
    
    humidity_min = models.FloatField(default=30, help_text="Minimum humidity in %")
    humidity_max = models.FloatField(default=80, help_text="Maximum humidity in %")
    
    soil_min = models.IntegerField(default=30, help_text="Minimum soil moisture in %")
    soil_max = models.IntegerField(default=70, help_text="Maximum soil moisture in %")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Thresholds for {self.farm.name}"


class Alert(models.Model):
    """Alerts when thresholds are exceeded"""
    ALERT_TYPES = [
        ('temperature_high', 'Temperature High'),
        ('temperature_low', 'Temperature Low'),
        ('humidity_high', 'Humidity High'),
        ('humidity_low', 'Humidity Low'),
        ('soil_dry', 'Soil Too Dry'),
        ('soil_wet', 'Soil Too Wet'),
        ('device_offline', 'Device Offline'),
    ]
    
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='alerts')
    device = models.ForeignKey(IoTDevice, on_delete=models.CASCADE, related_name='alerts', null=True)
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='warning')
    message = models.TextField()
    value = models.FloatField(null=True, blank=True)
    threshold = models.FloatField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.farm.name}"
    
    class Meta:
        ordering = ['-created_at']