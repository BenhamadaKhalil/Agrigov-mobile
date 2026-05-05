from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationUnreadCountView,
)

urlpatterns = [
    path('', NotificationListView.as_view()),
    path('unread-count/', NotificationUnreadCountView.as_view()),
    path('read-all/', NotificationMarkAllReadView.as_view()),
    path('<int:pk>/read/', NotificationMarkReadView.as_view()),
]