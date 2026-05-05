from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import get_region_stats, get_all_regions_stats, get_region_comparison
from missions.permissions import IsAdmin

class RegionStatsView(APIView):
    """GET /api/regions/{region_name}/stats/"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, region_name):
        try:
            return Response({
                "status": "success",
                "code": 200,
                "data": get_region_stats(region_name)
            })
        except ValueError as e:
            # Handles the custom error from services.py
            return Response({"status": "error", "code": 404, "message": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"status": "error", "code": 500, "message": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AllRegionsStatsView(APIView):
    """GET /api/regions/stats/"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({
            "status": "success",
            "code": 200,
            "data": get_all_regions_stats()
        })

class RegionComparisonView(APIView):
    """GET /api/regions/comparison/"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({
            "status": "success",
            "code": 200,
            "data": get_region_comparison()
        })