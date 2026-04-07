from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("email", "role", "is_verified", "is_staff", "is_active")
    list_filter = ("role", "is_verified", "is_staff", "is_active")
    search_fields = ("email", "phone", "username")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("username", "phone", "role")}),
        ("Permissions", {"fields": ("is_verified", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "created_at")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "phone", "role", "password1", "password2", "is_verified", "is_staff", "is_active")
        }),
    )

    readonly_fields = ("created_at", "last_login")