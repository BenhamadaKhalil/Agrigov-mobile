from rest_framework import serializers
from official_prices.models import OfficialPrice
from official_prices.serializers import OfficialPriceSerializer

class PriceItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    commodity = serializers.CharField()
    region = serializers.CharField()
    unit = serializers.CharField()
    min_price = serializers.FloatField()
    max_price = serializers.FloatField()
    price = serializers.CharField()         # formatted "min – max DZD"
    change = serializers.CharField()        # static for now
    changePct = serializers.CharField()
    trend = serializers.CharField()

class TickerItemSerializer(serializers.Serializer):
    emoji = serializers.CharField()
    label = serializers.CharField()
    price = serializers.CharField()
    trend = serializers.CharField()

class NewsArticleSerializer(serializers.Serializer):
    id = serializers.CharField()
    featured = serializers.BooleanField()
    category = serializers.CharField()
    date = serializers.CharField(required=False)
    title = serializers.CharField()
    excerpt = serializers.CharField()
    ctaLabel = serializers.CharField()
    href = serializers.CharField()
    imageUrl = serializers.URLField(required=False)
    imageAlt = serializers.CharField(required=False)

class HomepageResponseSerializer(serializers.Serializer):
    stats = serializers.DictField()
    ticker = TickerItemSerializer(many=True)
    prices = PriceItemSerializer(many=True)
    news = NewsArticleSerializer(many=True)