from django.urls import path
from .views import (
    CurrentPriceView,
    OfficialPriceCreateView,
    OfficialPriceUpdateView,
    OfficialPriceListView,
    ActivePricesView,
)

urlpatterns = [
    path("", OfficialPriceListView.as_view()),
    path("active/", ActivePricesView.as_view()),
    path("current/", CurrentPriceView.as_view()),
    path("create/", OfficialPriceCreateView.as_view()),
    path("<int:pk>/", OfficialPriceUpdateView.as_view()),
]