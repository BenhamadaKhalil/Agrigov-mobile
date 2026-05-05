from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ - Get user's notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationMarkReadView(APIView):
    """PATCH /api/notifications/{id}/read/ - Mark as read"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({'status': 'success', 'message': 'Marked as read'})
        except Notification.DoesNotExist:
            return Response({'status': 'error', 'message': 'Not found'}, status=404)


class NotificationMarkAllReadView(APIView):
    """PATCH /api/notifications/read-all/ - Mark all as read"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'success', 'message': 'All notifications marked as read'})


class NotificationUnreadCountView(APIView):
    """GET /api/notifications/unread-count/ - Get unread count"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})