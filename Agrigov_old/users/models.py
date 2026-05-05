from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from cloudinary.models import CloudinaryField
from regions.utils import get_region_from_wilaya 

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field is required")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.ROLE_ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")
        if extra_fields.get("role") != User.ROLE_ADMIN:
            raise ValueError("Superuser must have role=ADMIN")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_FARMER = "FARMER"
    ROLE_BUYER = "BUYER"
    ROLE_TRANSPORTER = "TRANSPORTER"
    ROLE_ADMIN = "ADMIN"

    ROLE_CHOICES = [
        (ROLE_FARMER, "Farmer"),
        (ROLE_BUYER, "Buyer"),
        (ROLE_TRANSPORTER, "Transporter"),
        (ROLE_ADMIN, "Admin"),
    ]

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)

    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} ({self.role})"

class FarmerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="farmer_profile")

    age = models.PositiveIntegerField()
    wilaya = models.CharField(max_length=100)
    baladiya = models.CharField(max_length=100)
    farm_size = models.FloatField(help_text="In hectares")
    address = models.TextField()

    farmer_card_image = CloudinaryField(
        "farmer_card",
        folder="AGRIGOV/farmers/farmerCards",
        transformation={"quality": "auto", "fetch_format": "auto"},
    )
    national_id_image = CloudinaryField(
        "national_id",
        folder="AGRIGOV/farmers/ids",
        transformation={"quality": "auto", "fetch_format": "auto"}
    )

    # Validation fields
    is_validated = models.BooleanField(default=False)
    validated_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_farmers"
    )
    rejection_reason = models.TextField(blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    # ← Add region field
    region = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-set region from wilaya
        if self.wilaya:
            self.region = get_region_from_wilaya(self.wilaya)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"FarmerProfile - {self.user.email}"
    @property
    def region(self):
        if self.wilaya:
            return get_region_from_wilaya(self.wilaya)
        return "Unknown"

class TransporterProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="transporter_profile")
    age = models.PositiveIntegerField()

    wilaya = models.CharField(max_length=100, blank=True)
    baladiya = models.CharField(max_length=100, blank=True)
    driver_license_image = CloudinaryField(
        "driver_license",
        folder="AGRIGOV/transporters/Permits",
        transformation={"quality": "auto", "fetch_format": "auto"}
    )
    grey_card_image = CloudinaryField(
        "grey_card",
        folder="AGRIGOV/transporters/greyCards",
        transformation={"quality": "auto", "fetch_format": "auto"}
    )

    # Validation fields
    is_validated = models.BooleanField(default=False)
    validated_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_transporters"
    )
    rejection_reason = models.TextField(blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    # ← Add region field
    region = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-set region from wilaya
        if self.wilaya:
            self.region = get_region_from_wilaya(self.wilaya)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"TransporterProfile - {self.user.email}"
    @property
    def region(self):
        if self.wilaya:
            return get_region_from_wilaya(self.wilaya)
        return "Unknown"


class BuyerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="buyer_profile")
    age = models.PositiveIntegerField()
    
    bussiness_license_image = CloudinaryField(
        "business_license",
        folder="AGRIGOV/buyers/businessLicenses",
        transformation={"quality": "auto", "fetch_format": "auto"}
    )

    # Validation fields
    is_validated = models.BooleanField(default=False)
    validated_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_buyers"
    )
    rejection_reason = models.TextField(blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"BuyerProfile - {self.user.email}"
    @property
    def region(self):
        if self.wilaya:
            return get_region_from_wilaya(self.wilaya)
        return "Unknown"


class MinistryProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="ministry_profile")
    phone = models.CharField(max_length=20, blank=True)
    office_address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"MinistryProfile - {self.user.email}"

    class Meta:
        verbose_name = "Ministry Profile"
        verbose_name_plural = "Ministry Profiles"