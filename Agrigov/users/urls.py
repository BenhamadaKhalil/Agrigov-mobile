from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AllUsersView,
    RegisterView,
    LoginView,
    MeView,
    FarmerProfileView,
    TransporterProfileView,
    BuyerProfileView,
    MinistryProfileView,
    PendingUsersView,
    ValidateUserView,
    RejectUserView,
    UserDetailView,
)

urlpatterns = [
    # Authentication
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    
    # Current user
    path("me/", MeView.as_view()),
    
    # User Profiles
    path("auth/farmer-profile/", FarmerProfileView.as_view()),
    path("auth/transporter-profile/", TransporterProfileView.as_view()),
    path("auth/buyer-profile/", BuyerProfileView.as_view()),
    path("auth/ministry-profile/", MinistryProfileView.as_view()),
    
    # Ministry Validation Endpoints
    path("pending/", PendingUsersView.as_view(), name="pending-users"),
    path("<int:user_id>/validate/", ValidateUserView.as_view(), name="validate-user"),
    path("<int:user_id>/reject/", RejectUserView.as_view(), name="reject-user"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("", AllUsersView.as_view(), name="all-users"),
]