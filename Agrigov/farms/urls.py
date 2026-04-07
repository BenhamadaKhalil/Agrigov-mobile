from django.urls import path
from .views import CreateFarmView, ListMyFarmsView

urlpatterns = [
    path("", CreateFarmView.as_view()),
    path("me/", ListMyFarmsView.as_view()),
]