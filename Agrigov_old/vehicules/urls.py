from django.urls import path
from .views import CreateVehicleView, ListMyVehiclesView

urlpatterns = [
    path("", CreateVehicleView.as_view()),
    path("me/", ListMyVehiclesView.as_view()),
]