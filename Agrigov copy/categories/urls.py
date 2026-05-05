from django.urls import path
from .views import CategoryListView, CategoryDetailView, CreateCategoryView,UpdateCategoryView,DeleteCategoryView

urlpatterns = [
    path("", CategoryListView.as_view()),
    path("<int:pk>/", CategoryDetailView.as_view()),
    path("create/", CreateCategoryView.as_view()),
    path("<int:pk>/update/", UpdateCategoryView.as_view()),
    path("<int:pk>/delete/", DeleteCategoryView.as_view()),
]