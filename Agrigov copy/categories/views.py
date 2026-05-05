from rest_framework import generics, permissions
from .models import Category
from .serializers import CategorySerializer
from .permissions import IsAdminUserCustom


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class CreateCategoryView(generics.CreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserCustom]
    
    
class DeleteCategoryView(generics.DestroyAPIView):
    queryset = Category.objects.all()
    permission_classes = [IsAdminUserCustom]
    
class UpdateCategoryView(generics.UpdateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserCustom]