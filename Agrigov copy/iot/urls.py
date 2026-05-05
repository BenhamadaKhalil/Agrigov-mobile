from django.urls import path
from .views import (
    IoTDataReceiveView,
    ClaimDeviceView,
    StopRecordingView,
    FarmSensorDataView,
    FarmSensorStatsView,
    AlertThresholdView,
    FarmAlertsView,
    ResolveAlertView,
    AIRecommendationView,
)

urlpatterns = [
    path('data/', IoTDataReceiveView.as_view(), name='iot-data'),
    path('claim-device/', ClaimDeviceView.as_view(), name='claim-device'),
    path('stop-recording/', StopRecordingView.as_view(), name='stop-recording'),
    path('farm/data/', FarmSensorDataView.as_view(), name='farm-sensor-data'),
    path('farm/stats/', FarmSensorStatsView.as_view(), name='farm-sensor-stats'),
    path('farm/thresholds/', AlertThresholdView.as_view(), name='alert-thresholds'),
    path('farm/alerts/', FarmAlertsView.as_view(), name='farm-alerts'),
    path('alerts/<int:alert_id>/resolve/', ResolveAlertView.as_view(), name='resolve-alert'),
    path('recommendations/', AIRecommendationView.as_view(), name='ai-recommendations'),
]