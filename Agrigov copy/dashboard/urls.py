from django.urls import path
from .views import DashboardViewSet

urlpatterns = [
    # General entry point (optional)
    path('dashboard/', DashboardViewSet.as_view({'get': 'get_main_dashboard'}), name='dashboard-main'),
    
    # Role-specific endpoints
    path('admin/', DashboardViewSet.as_view({'get': 'admin_stats'}), name='dashboard-admin'),
    path('farmer/', DashboardViewSet.as_view({'get': 'farmer_stats'}), name='dashboard-farmer'),
    path('buyer/', DashboardViewSet.as_view({'get': 'buyer_stats'}), name='dashboard-buyer'),
    path('transporter/', DashboardViewSet.as_view({'get': 'transporter_stats'}), name='dashboard-transporter'),
]