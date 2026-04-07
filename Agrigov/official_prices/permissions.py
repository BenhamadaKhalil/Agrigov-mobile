from rest_framework.permissions import BasePermission

from farms.models import Farm


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class IsFarmer(BasePermission):
    def has_permission(self, request, view):
        return Farm.objects.filter(farmer=request.user).exists()