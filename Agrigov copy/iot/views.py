from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Avg, Min, Max
from datetime import timedelta

from .models import IoTDevice, SensorData, AlertThreshold, Alert
from .serializers import (
    IoTDeviceSerializer,
    SensorDataSerializer,
    AlertThresholdSerializer,
    AlertSerializer
)
from farms.models import Farm
from .ai_engine import AgriAIAdvisor
from missions.permissions import IsFarmer, IsAdmin


class IoTDataReceiveView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        mac_address = request.headers.get('X-ESP32-MAC', None)

        if not mac_address:
            mac_address = request.data.get('mac_address', None)

        if not mac_address:
            return Response(
                {'error': 'MAC address required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mac_address = mac_address.strip().upper()

        # Find device by MAC
        device = IoTDevice.objects.filter(mac_address=mac_address, is_active=True).first()

        if not device:
            return Response(
                {'status': 'ignored', 'message': 'Device not registered yet. Click Connect My ESP32 first.'},
                status=status.HTTP_200_OK
            )

        # Check if recording is ON
        if not device.is_recording:
            device.last_seen = timezone.now()
            device.save()
            return Response(
                {'status': 'ignored', 'message': 'Recording is stopped. Click Connect My ESP32 to start.'},
                status=status.HTTP_200_OK
            )

        # Update last_seen
        device.last_seen = timezone.now()
        device.save()

        # Save sensor data ONLY if recording
        temperature = request.data.get('temperature')
        humidity = request.data.get('humidity')
        soil_moisture = request.data.get('soil_moisture')

        sensor_data = SensorData.objects.create(
            device=device,
            temperature=temperature,
            humidity=humidity,
            soil_moisture=soil_moisture,
            recorded_at=timezone.now()
        )

        self.check_thresholds(device.farm, sensor_data)

        return Response(
            {'status': 'success', 'message': 'Data saved', 'device': device.device_id, 'farm': device.farm.name, 'recording': True},
            status=status.HTTP_200_OK
        )

    def check_thresholds(self, farm, sensor_data):
        try:
            thresholds = AlertThreshold.objects.get(farm=farm)
        except AlertThreshold.DoesNotExist:
            return

        if sensor_data.temperature is not None:
            if sensor_data.temperature > thresholds.temp_max:
                self.create_alert(farm, sensor_data.device, 'temperature_high',
                                  'critical', f"Temperature is {sensor_data.temperature}°C (max: {thresholds.temp_max}°C)",
                                  sensor_data.temperature, thresholds.temp_max)
            elif sensor_data.temperature < thresholds.temp_min:
                self.create_alert(farm, sensor_data.device, 'temperature_low',
                                  'warning', f"Temperature is {sensor_data.temperature}°C (min: {thresholds.temp_min}°C)",
                                  sensor_data.temperature, thresholds.temp_min)

        if sensor_data.humidity is not None:
            if sensor_data.humidity > thresholds.humidity_max:
                self.create_alert(farm, sensor_data.device, 'humidity_high',
                                  'warning', f"Humidity is {sensor_data.humidity}% (max: {thresholds.humidity_max}%)",
                                  sensor_data.humidity, thresholds.humidity_max)
            elif sensor_data.humidity < thresholds.humidity_min:
                self.create_alert(farm, sensor_data.device, 'humidity_low',
                                  'warning', f"Humidity is {sensor_data.humidity}% (min: {thresholds.humidity_min}%)",
                                  sensor_data.humidity, thresholds.humidity_min)

        if sensor_data.soil_moisture is not None:
            if sensor_data.soil_moisture < thresholds.soil_min:
                self.create_alert(farm, sensor_data.device, 'soil_dry',
                                  'critical', f"Soil moisture is {sensor_data.soil_moisture}% (min: {thresholds.soil_min}%)",
                                  sensor_data.soil_moisture, thresholds.soil_min)
            elif sensor_data.soil_moisture > thresholds.soil_max:
                self.create_alert(farm, sensor_data.device, 'soil_wet',
                                  'info', f"Soil moisture is {sensor_data.soil_moisture}% (max: {thresholds.soil_max}%)",
                                  sensor_data.soil_moisture, thresholds.soil_max)

    def create_alert(self, farm, device, alert_type, severity, message, value, threshold):
        existing = Alert.objects.filter(farm=farm, alert_type=alert_type, is_resolved=False).first()
        if not existing:
            Alert.objects.create(
                farm=farm, device=device, alert_type=alert_type,
                severity=severity, message=message, value=value, threshold=threshold
            )


class ClaimDeviceView(APIView):
    """Start recording - assign device to farmer's farm and turn ON recording"""
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def post(self, request):
        farm = Farm.objects.filter(farmer=request.user).first()
        if not farm:
            return Response({'error': 'No farm found'}, status=404)

        # Find the most recently active ESP32
        latest_device = IoTDevice.objects.filter(is_active=True).order_by('-last_seen').first()

        if not latest_device:
            return Response(
                {'error': 'No ESP32 found. Make sure ESP32 is running.'},
                status=404
            )

        # Assign to this farmer's farm and TURN ON recording
        latest_device.farm = farm
        latest_device.is_recording = True
        latest_device.save()

        return Response({
            'status': 'success',
            'message': f'ESP32 connected to {farm.name}. Recording started!',
            'device': IoTDeviceSerializer(latest_device).data
        })


class StopRecordingView(APIView):
    """Stop recording - turn OFF recording for the farmer's device"""
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def post(self, request):
        farm = Farm.objects.filter(farmer=request.user).first()
        if not farm:
            return Response({'error': 'No farm found'}, status=404)

        device = IoTDevice.objects.filter(farm=farm, is_active=True).first()

        if not device:
            return Response({'error': 'No device found for your farm'}, status=404)

        device.is_recording = False
        device.save()

        return Response({
            'status': 'success',
            'message': f'Recording stopped for {farm.name}.',
            'device': IoTDeviceSerializer(device).data
        })


class FarmSensorDataView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get(self, request):
        farm = Farm.objects.filter(farmer=request.user).first()
        if not farm:
            return Response({'error': 'No farm found'}, status=404)

        readings = SensorData.objects.filter(
            device__farm=farm
        ).select_related('device').order_by('-recorded_at')[:100]

        # Check if device is recording
        device = IoTDevice.objects.filter(farm=farm).first()
        is_recording = device.is_recording if device else False

        return Response({
            'farm_id': farm.id,
            'farm_name': farm.name,
            'is_recording': is_recording,
            'readings': SensorDataSerializer(readings, many=True).data
        })


class FarmSensorStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get(self, request):
        farm = Farm.objects.filter(farmer=request.user).first()
        if not farm:
            return Response({'error': 'No farm found'}, status=404)

        last_24h = timezone.now() - timedelta(hours=24)

        stats = SensorData.objects.filter(
            device__farm=farm, recorded_at__gte=last_24h
        ).aggregate(
            avg_temp=Avg('temperature'), min_temp=Min('temperature'), max_temp=Max('temperature'),
            avg_humidity=Avg('humidity'), min_humidity=Min('humidity'), max_humidity=Max('humidity'),
            avg_soil=Avg('soil_moisture'), min_soil=Min('soil_moisture'), max_soil=Max('soil_moisture')
        )

        latest = SensorData.objects.filter(device__farm=farm).order_by('-recorded_at').first()
        device = IoTDevice.objects.filter(farm=farm).first()

        return Response({
            'farm_id': farm.id,
            'farm_name': farm.name,
            'is_recording': device.is_recording if device else False,
            'statistics': {
                'temperature': {
                    'avg': round(stats['avg_temp'], 1) if stats['avg_temp'] else None,
                    'min': stats['min_temp'], 'max': stats['max_temp'],
                },
                'humidity': {
                    'avg': round(stats['avg_humidity'], 1) if stats['avg_humidity'] else None,
                    'min': stats['min_humidity'], 'max': stats['max_humidity'],
                },
                'soil_moisture': {
                    'avg': round(stats['avg_soil'], 1) if stats['avg_soil'] else None,
                    'min': stats['min_soil'], 'max': stats['max_soil'],
                }
            },
            'latest': SensorDataSerializer(latest).data if latest else None,
            'thresholds': None
        })


class AlertThresholdView(generics.RetrieveUpdateAPIView):
    serializer_class = AlertThresholdSerializer
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get_object(self):
        farm = Farm.objects.filter(farmer=self.request.user).first()
        if not farm:
            from rest_framework.exceptions import NotFound
            raise NotFound("No farm found")
        thresholds, created = AlertThreshold.objects.get_or_create(farm=farm)
        return thresholds


class FarmAlertsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get(self, request):
        farm = Farm.objects.filter(farmer=request.user).first()
        if not farm:
            return Response({'error': 'No farm found'}, status=404)

        alerts = Alert.objects.filter(farm=farm, is_resolved=False).order_by('-created_at')[:50]
        device = IoTDevice.objects.filter(farm=farm).first()

        return Response({
            'farm_id': farm.id,
            'farm_name': farm.name,
            'is_recording': device.is_recording if device else False,
            'alerts': AlertSerializer(alerts, many=True).data
        })


class ResolveAlertView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def patch(self, request, alert_id):
        farm = Farm.objects.filter(farmer=request.user).first()
        if not farm:
            return Response({'error': 'No farm found'}, status=404)

        try:
            alert = Alert.objects.get(id=alert_id, farm=farm)
            alert.is_resolved = True
            alert.resolved_at = timezone.now()
            alert.save()
            return Response({'status': 'success', 'message': 'Alert resolved'})
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=404)
        
class AIRecommendationView(APIView):
    """
    GET /api/iot/recommendations/
    Get 100% AI-powered recommendations
    """
    permission_classes = [permissions.IsAuthenticated, IsFarmer]
    
    def get(self, request):
        farm = Farm.objects.filter(farmer=request.user).first()
        if not farm:
            return Response({'error': 'No farm found'}, status=404)
        
        # Get latest sensor data
        latest = SensorData.objects.filter(
            device__farm=farm
        ).order_by('-recorded_at').first()
        
        if not latest:
            return Response({
                'error': 'No sensor data yet. Start recording first.',
                'ai_analysis': None
            }, status=200)
        
        # Get 24h statistics
        last_24h = timezone.now() - timedelta(hours=24)
        history_stats = SensorData.objects.filter(
            device__farm=farm,
            recorded_at__gte=last_24h
        ).aggregate(
            avg_temp=Avg('temperature'),
            avg_humidity=Avg('humidity'),
            avg_soil=Avg('soil_moisture')
        )
        
        formatted_stats = {
            'avg_temp': round(history_stats['avg_temp'], 1) if history_stats['avg_temp'] else None,
            'avg_humidity': round(history_stats['avg_humidity'], 1) if history_stats['avg_humidity'] else None,
            'avg_soil': round(history_stats['avg_soil'], 1) if history_stats['avg_soil'] else None,
        }
        
        # Get AI recommendations - NO FALLBACK
        try:
            advisor = AgriAIAdvisor()
            ai_analysis = advisor.analyze(latest, formatted_stats, farm)
            
            return Response({
                'farm_name': farm.name,
                'generated_at': timezone.now().isoformat(),
                'ai_model': 'llama-3.1-8b-instant (via Groq)',
                'ai_analysis': ai_analysis
            })
            
        except Exception as e:
            return Response({
                'error': f'AI service temporarily unavailable: {str(e)}',
                'ai_analysis': None,
                'generated_at': timezone.now().isoformat()
            }, status=503)