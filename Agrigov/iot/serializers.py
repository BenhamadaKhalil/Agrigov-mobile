from rest_framework import serializers
from .models import IoTDevice, SensorData, AlertThreshold, Alert


class IoTDeviceSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    
    class Meta:
        model = IoTDevice
        fields = ['id', 'device_id', 'mac_address', 'farm', 'farm_name', 
                  'device_type', 'is_active', 'installed_at', 'last_seen']
        read_only_fields = ['id', 'installed_at', 'last_seen']


class SensorDataSerializer(serializers.ModelSerializer):
    device_id = serializers.CharField(source='device.device_id', read_only=True)
    farm_name = serializers.CharField(source='device.farm.name', read_only=True)
    
    class Meta:
        model = SensorData
        fields = ['id', 'device', 'device_id', 'farm_name', 'temperature', 'humidity', 
                  'soil_moisture', 'recorded_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class SensorDataCreateSerializer(serializers.Serializer):
    """Serializer for receiving data from ESP32 - auto-identifies by MAC address"""
    temperature = serializers.FloatField(required=False, allow_null=True)
    humidity = serializers.FloatField(required=False, allow_null=True)
    soil_moisture = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, data):
        request = self.context.get('request')
        
        # Get MAC address from request (set by view from headers)
        mac_address = getattr(request, 'device_mac', None)
        
        if not mac_address:
            raise serializers.ValidationError("Could not identify device. MAC address required.")
        
        # Find registered device by MAC
        try:
            device = IoTDevice.objects.select_related('farm').get(
                mac_address=mac_address,
                is_active=True
            )
        except IoTDevice.DoesNotExist:
            raise serializers.ValidationError(
                f"Device with MAC {mac_address} not registered. Please register first."
            )
        
        data['farm'] = device.farm
        data['device'] = device
        return data


class AlertThresholdSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    
    class Meta:
        model = AlertThreshold
        fields = ['id', 'farm', 'farm_name', 'temp_min', 'temp_max', 
                  'humidity_min', 'humidity_max', 'soil_min', 'soil_max']


class AlertSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    device_id = serializers.CharField(source='device.device_id', read_only=True, allow_null=True)
    
    class Meta:
        model = Alert
        fields = ['id', 'farm', 'farm_name', 'device', 'device_id', 'alert_type', 
                  'severity', 'message', 'value', 'threshold', 'is_resolved', 
                  'resolved_at', 'created_at']