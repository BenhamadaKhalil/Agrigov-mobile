from rest_framework import viewsets, permissions, response, status
from .services import DashboardService

class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class IsFarmerRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'FARMER'

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def admin_stats(self, request):
        if request.user.role != 'ADMIN':
            return response.Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        data = DashboardService.get_admin_dashboard()
        return response.Response(data)

    def farmer_stats(self, request):
        if request.user.role != 'FARMER':
            return response.Response({"error": "Farmer access required"}, status=status.HTTP_403_FORBIDDEN)
        data = DashboardService.get_farmer_dashboard(request.user)
        return response.Response(data)

    def buyer_stats(self, request):
        if request.user.role != 'BUYER':
            return response.Response({"error": "Buyer access required"}, status=status.HTTP_403_FORBIDDEN)
        data = DashboardService.get_buyer_dashboard(request.user)
        return response.Response(data)

    def transporter_stats(self, request):
        if request.user.role != 'TRANSPORTER':
            return response.Response({"error": "Transporter access required"}, status=status.HTTP_403_FORBIDDEN)
        data = DashboardService.get_transporter_dashboard(request.user)
        return response.Response(data)

    # Legacy support for the original 'dashboard/' URL
    def get_main_dashboard(self, request):
        role = request.user.role
        if role == 'ADMIN': return self.admin_stats(request)
        if role == 'FARMER': return self.farmer_stats(request)
        if role == 'BUYER': return self.buyer_stats(request)
        if role == 'TRANSPORTER': return self.transporter_stats(request)
        return response.Response({"error": "Role not recognized"}, status=400)