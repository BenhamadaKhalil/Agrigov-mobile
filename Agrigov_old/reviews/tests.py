from rest_framework.test import APITestCase
from users.models import User, BuyerProfile
from farms.models import Farm
from products.models import Product
from orders.models import Order, OrderItem


class ReviewAPITests(APITestCase):
    def setUp(self):
        self.farmer = User.objects.create_user(
            email='farmer@example.com',
            password='testpass',
            role='FARMER'
        )
        self.farmer_profile = Farm.objects.create(
            farmer=self.farmer,
            name='Test Farm',
            wilaya='Algiers',
            baladiya='Bab Ezzouar',
            farm_size=3.5,
            address='123 Farm Road'
        )

        self.product = Product.objects.create(
            farm=self.farmer_profile,
            title='Test Tomato',
            description='Fresh tomatoes',
            unit_price=10.00,
            stock=100,
            category=None
        )

        self.buyer = User.objects.create_user(
            email='buyer@example.com',
            password='testpass',
            role='BUYER'
        )
        self.buyer_profile = BuyerProfile.objects.create(
            user=self.buyer,
            age=30,
            bussiness_license_image='test.jpg'
        )

    def test_create_review_successful_for_purchased_product(self):
        order = Order.objects.create(
            buyer=self.buyer_profile,
            farm=self.farmer_profile,
            total_price=20.0,
            status='confirmed'
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price=10.0
        )

        self.client.force_authenticate(user=self.buyer)
        response = self.client.post('/api/reviews/', {
            'product': self.product.id,
            'rating': 5,
            'comment': 'Excellent'
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.review_count, 1)
        self.assertEqual(float(self.product.average_rating), 5.0)

    def test_create_review_fails_when_not_purchased(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post('/api/reviews/', {
            'product': self.product.id,
            'rating': 4,
            'comment': 'Should fail'
        }, format='json')

        self.assertEqual(response.status_code, 400)

    def test_my_reviews_endpoint(self):
        order = Order.objects.create(
            buyer=self.buyer_profile,
            farm=self.farmer_profile,
            total_price=20.0,
            status='confirmed'
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price=10.0
        )

        self.client.force_authenticate(user=self.buyer)
        self.client.post('/api/reviews/', {
            'product': self.product.id,
            'rating': 5,
            'comment': 'Great'
        }, format='json')

        response = self.client.get('/api/my-reviews/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

