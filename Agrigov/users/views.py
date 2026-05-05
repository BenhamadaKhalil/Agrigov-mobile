import logging
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from missions.permissions import IsAdmin
from .models import MinistryProfile, User, FarmerProfile, TransporterProfile, BuyerProfile
from .serializers import (
    FarmerProfileSerializer,
    MeSerializer,
    MinistryProfileSerializer,
    RegisterSerializer,
    TransporterProfileSerializer,
    UserSerializer,
    LoginSerializer,
    BuyerProfileSerializer
)

logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = get_tokens_for_user(user)

        return Response(
            {
                "status": "success",
                "code": status.HTTP_201_CREATED,
                "message": "User registered successfully",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": tokens
                }
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        
        # ✅ Check if user is validated (for farmers, transporters, buyers)
        if user.role in ["FARMER", "TRANSPORTER", "BUYER"]:
            is_validated = False
            
            # Check validation status based on role
            if user.role == "FARMER" and hasattr(user, 'farmer_profile'):
                is_validated = user.farmer_profile.is_validated
            elif user.role == "TRANSPORTER" and hasattr(user, 'transporter_profile'):
                is_validated = user.transporter_profile.is_validated
            elif user.role == "BUYER" and hasattr(user, 'buyer_profile'):
                is_validated = user.buyer_profile.is_validated
            
            # Block login if not validated
            if not is_validated:
                return Response(
                    {
                        "status": "error",
                        "code": 403,
                        "message": "Your account is pending validation by the Ministry. Please wait for approval."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "message": "Login successful",
                "data": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data
                }
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user)

        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )



class FarmerProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile = getattr(request.user, "farmer_profile", None)
        if not profile:
            return Response({"detail": "Profile not found"}, status=404)

        serializer = FarmerProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        if hasattr(request.user, "farmer_profile"):
            return Response(
                {"detail": "Profile already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = FarmerProfileSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)

    def put(self, request):
        profile = getattr(request.user, "farmer_profile", None)
        if not profile:
            return Response({"detail": "Profile not found"}, status=404)

        serializer = FarmerProfileSerializer(
            profile, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)


class TransporterProfileView(generics.RetrieveUpdateAPIView, generics.CreateAPIView):
    serializer_class = TransporterProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return TransporterProfile.objects.filter(user=self.request.user)

    def get_object(self):
        return TransporterProfile.objects.get(user=self.request.user)

class BuyerProfileView(generics.RetrieveUpdateAPIView, generics.CreateAPIView):
    serializer_class = BuyerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return BuyerProfile.objects.filter(user=self.request.user)

    def get_object(self):
        return BuyerProfile.objects.get(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MinistryProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = MinistryProfileSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        return MinistryProfile.objects.filter(user=self.request.user)
    
    def get_object(self):
        user = self.request.user
        profile, created = MinistryProfile.objects.get_or_create(user=user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "message": "Ministry profile updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class PendingUsersView(generics.ListAPIView):
    """
    GET /api/users/pending/
    Ministry views all unvalidated users (farmers, transporters, buyers)
    """
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        # Get IDs of validated farmers
        validated_farmers = FarmerProfile.objects.filter(
            is_validated=True
        ).values_list('user_id', flat=True)
        
        # Get IDs of validated transporters
        validated_transporters = TransporterProfile.objects.filter(
            is_validated=True
        ).values_list('user_id', flat=True)
        
        # Get IDs of validated buyers
        validated_buyers = BuyerProfile.objects.filter(
            is_validated=True
        ).values_list('user_id', flat=True)
        
        # Combine all validated user IDs
        validated_ids = set(validated_farmers) | set(validated_transporters) | set(validated_buyers)
        
        # Get users who are NOT validated
        return User.objects.filter(
            role__in=["FARMER", "TRANSPORTER", "BUYER"]
        ).exclude(id__in=validated_ids)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "status": "success",
                "code": status.HTTP_200_OK,
                "data": serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "count": len(serializer.data),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class ValidateUserView(APIView):
    """
    PATCH /api/users/{id}/validate/
    Ministry validates a user's profile
    """
    permission_classes = [IsAdmin]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_404_NOT_FOUND,
                    "message": "User not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        now = timezone.now()

        # Check if user has profile
        if user.role == "FARMER" and not hasattr(user, 'farmer_profile'):
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Farmer has no profile to validate"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif user.role == "TRANSPORTER" and not hasattr(user, 'transporter_profile'):
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Transporter has no profile to validate"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif user.role == "BUYER" and not hasattr(user, 'buyer_profile'):
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Buyer has no profile to validate"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate based on role
        if user.role == "FARMER":
            profile = user.farmer_profile
            profile.is_validated = True
            profile.validated_at = now
            profile.validated_by = request.user
            profile.rejection_reason = ""
            profile.rejected_at = None
            profile.save()
        
        elif user.role == "TRANSPORTER":
            profile = user.transporter_profile
            profile.is_validated = True
            profile.validated_at = now
            profile.validated_by = request.user
            profile.rejection_reason = ""
            profile.rejected_at = None
            profile.save()
        
        elif user.role == "BUYER":
            profile = user.buyer_profile
            profile.is_validated = True
            profile.validated_at = now
            profile.validated_by = request.user
            profile.rejection_reason = ""
            profile.rejected_at = None
            profile.save()
        
        else:
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "This role does not require validation"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark user as verified
        user.is_verified = True
        user.save()

        # Log the action (optional)
        logger.info(f"Admin {request.user.email} validated user {user.email} (ID: {user.id})")

        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "message": "User validated successfully",
                "data": {
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "phone": user.phone,
                        "role": user.role,
                        "is_verified": user.is_verified,
                        "is_active": user.is_active
                    },
                    "profile": {
                        "is_validated": True,
                        "validated_at": now,
                        "validated_by": request.user.email
                    }
                }
            },
            status=status.HTTP_200_OK
        )


class RejectUserView(APIView):
    """
    PATCH /api/users/{id}/reject/
    Ministry rejects a user's profile with reason
    """
    permission_classes = [IsAdmin]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_404_NOT_FOUND,
                    "message": "User not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Get rejection reason
        reason = request.data.get("reason", "")
        if not reason:
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Rejection reason is required",
                    "errors": {
                        "reason": ["This field is required"]
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate reason length
        if len(reason) > 500:
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Reason too long",
                    "errors": {
                        "reason": ["Maximum 500 characters allowed"]
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()

        # Check if user has profile
        if user.role == "FARMER" and not hasattr(user, 'farmer_profile'):
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Farmer has no profile to reject"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif user.role == "TRANSPORTER" and not hasattr(user, 'transporter_profile'):
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Transporter has no profile to reject"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif user.role == "BUYER" and not hasattr(user, 'buyer_profile'):
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "Buyer has no profile to reject"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reject based on role
        if user.role == "FARMER":
            profile = user.farmer_profile
            profile.is_validated = False
            profile.rejection_reason = reason
            profile.rejected_at = now
            profile.validated_by = request.user
            profile.save()
        
        elif user.role == "TRANSPORTER":
            profile = user.transporter_profile
            profile.is_validated = False
            profile.rejection_reason = reason
            profile.rejected_at = now
            profile.validated_by = request.user
            profile.save()
        
        elif user.role == "BUYER":
            profile = user.buyer_profile
            profile.is_validated = False
            profile.rejection_reason = reason
            profile.rejected_at = now
            profile.validated_by = request.user
            profile.save()
        
        else:
            return Response(
                {
                    "status": "error",
                    "code": status.HTTP_400_BAD_REQUEST,
                    "message": "User profile not found"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deactivate user
        user.is_active = False
        user.save()

        # Log the action (optional)
        logger.info(f"Admin {request.user.email} rejected user {user.email} (ID: {user.id}) - Reason: {reason[:100]}")

        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "message": "User rejected successfully",
                "data": {
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "role": user.role
                    },
                    "rejection": {
                        "reason": reason,
                        "rejected_at": now,
                        "rejected_by": request.user.email
                    }
                }
            },
            status=status.HTTP_200_OK
        )


class UserDetailView(generics.RetrieveAPIView):
    """
    GET /api/users/{id}/
    Ministry views detailed user information including profile and documents
    """
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Add profile data based on role
        data = UserSerializer(user).data
        
        if user.role == "FARMER" and hasattr(user, 'farmer_profile'):
            profile = user.farmer_profile
            data['profile'] = {
                'type': 'farmer',
                'age': profile.age,
                'wilaya': profile.wilaya,
                'baladiya': profile.baladiya,
                'farm_size': profile.farm_size,
                'address': profile.address,
                'documents': {
                    'farmer_card_image': profile.farmer_card_image.url if profile.farmer_card_image else None,
                    'national_id_image': profile.national_id_image.url if profile.national_id_image else None,
                },
                'validation': {
                    'is_validated': profile.is_validated,
                    'validated_at': profile.validated_at,
                    'validated_by': profile.validated_by.email if profile.validated_by else None,
                    'rejection_reason': profile.rejection_reason,
                    'rejected_at': profile.rejected_at,
                }
            }
        
        elif user.role == "TRANSPORTER" and hasattr(user, 'transporter_profile'):
            profile = user.transporter_profile
            data['profile'] = {
                'type': 'transporter',
                'age': profile.age,
                'wilaya': profile.wilaya,
                'baladiya': profile.baladiya,
                'documents': {
                    'driver_license_image': profile.driver_license_image.url if profile.driver_license_image else None,
                    'grey_card_image': profile.grey_card_image.url if profile.grey_card_image else None,
                },
                'validation': {
                    'is_validated': profile.is_validated,
                    'validated_at': profile.validated_at,
                    'validated_by': profile.validated_by.email if profile.validated_by else None,
                    'rejection_reason': profile.rejection_reason,
                    'rejected_at': profile.rejected_at,
                }
            }
        
        elif user.role == "BUYER" and hasattr(user, 'buyer_profile'):
            profile = user.buyer_profile
            data['profile'] = {
                'type': 'buyer',
                'age': profile.age,
                'documents': {
                    'business_license_image': profile.bussiness_license_image.url if profile.bussiness_license_image else None,
                },
                'validation': {
                    'is_validated': profile.is_validated,
                    'validated_at': profile.validated_at,
                    'validated_by': profile.validated_by.email if profile.validated_by else None,
                    'rejection_reason': profile.rejection_reason,
                    'rejected_at': profile.rejected_at,
                }
            }
        
        return Response(
            {
                "status": "success",
                "code": status.HTTP_200_OK,
                "data": {
                    "user": data
                }
            },
            status=status.HTTP_200_OK
        )
        
class AllUsersView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-created_at')

class DeleteUserView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        user.delete()
        return Response({"message": f"User {user.email} deleted successfully"}, status=200)