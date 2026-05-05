from rest_framework.permissions import BasePermission


class IsFarmerOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.farm.farmer == request.user
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff