from django.urls import path
from .views import (
    MissionCreateView,
    FarmerMissionListView,
    MissionCancelView,
    AvailableMissionsView,
    MissionAcceptView,
    MissionDeclineView,
    MissionStatusUpdateView,
    TransporterMissionListView,
    MissionDetailView,
)

urlpatterns = [
    # FARMER
    path("", MissionCreateView.as_view(), name="mission-create"),
    path("my-farm/", FarmerMissionListView.as_view(), name="farmer-missions"),
    path("<int:pk>/cancel/", MissionCancelView.as_view(), name="mission-cancel"),

    # TRANSPORTER
    path("available/", AvailableMissionsView.as_view(), name="available-missions"),
    path("my/", TransporterMissionListView.as_view(), name="transporter-missions"),
    path("<int:pk>/accept/", MissionAcceptView.as_view(), name="mission-accept"),
    path("<int:pk>/decline/", MissionDeclineView.as_view(), name="mission-decline"),
    path("<int:pk>/status/", MissionStatusUpdateView.as_view(), name="mission-status"),

    # SHARED
    path("<int:pk>/", MissionDetailView.as_view(), name="mission-detail"),
]