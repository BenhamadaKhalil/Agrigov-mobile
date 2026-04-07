from django.urls import path
from .views import RegionStatsView, AllRegionsStatsView, RegionComparisonView

urlpatterns = [
    path('stats/', AllRegionsStatsView.as_view(), name='all-regions-stats'),
    path('comparison/', RegionComparisonView.as_view(), name='region-comparison'),
    path('<str:region_name>/stats/', RegionStatsView.as_view(), name='region-stats'),
]