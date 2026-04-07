from rest_framework import serializers

from orders.models import OrderItem
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'product', 'buyer', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'buyer']

    def validate(self, attrs):
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        buyer_profile = getattr(request.user, 'buyer_profile', None)

        if not buyer_profile:
            raise serializers.ValidationError("Only buyers can leave reviews.")


        product = attrs.get('product') or getattr(self.instance, 'product', None)

        # Only check purchase on CREATE
        if self.instance is None:
            has_purchased = OrderItem.objects.filter(
                order__buyer=buyer_profile,
                product=product,
                order__status='delivered'
            ).exists()

            if not has_purchased:
                raise serializers.ValidationError({
                    "product": "You can only review products you have purchased."
                })

        attrs['buyer'] = buyer_profile
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        buyer = request.user.buyer_profile
        product = validated_data.get('product')

        has_purchased = OrderItem.objects.filter(
            order__buyer=buyer,
            product=product,
            order__status='delivered'
        ).exists()

        if not has_purchased:
            raise serializers.ValidationError({
                "product": "You can only review products you have purchased."
            })

        validated_data['buyer'] = buyer
        return super().create(validated_data)