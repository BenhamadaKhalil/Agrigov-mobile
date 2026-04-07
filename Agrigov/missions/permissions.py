from rest_framework.permissions import BasePermission


class IsFarmer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "FARMER"


class IsTransporter(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "TRANSPORTER"


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


# class IsFarmerOrAdmin(BasePermission):
#     def has_permission(self, request, view):
#         return request.user.is_authenticated and request.user.role in ["FARMER", "ADMIN"]


class IsTransporterOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["TRANSPORTER", "ADMIN"]