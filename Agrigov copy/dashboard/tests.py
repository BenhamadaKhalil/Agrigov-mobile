from rest_framework.test import APITestCase
from users.models import User, BuyerProfile
from farms.models import Farm
from products.models import Product
from orders.models import Order, OrderItem
from reviews.models import Review


class DashboardAPITests(APITestCase):
    def setUp(self):
        self.farmer = User.objects.create_user(
            email='farmer2@example.com',
            password='testpass',
            role='FARMER'
        )
        self.farm = Farm.objects.create(
            farmer=self.farmer,
            name='Farmer Farm',
            wilaya='Oran',
            baladiya='Bir Mourad Rais',
            farm_size=4.1,
            address='45 Terre'
        )

        self.product = Product.objects.create(
            farm=self.farm,
            title='Corn',
            description='Sweet corn',
            unit_price=5.0,
            stock=50,
            category=None
        )

        self.buyer = User.objects.create_user(
            email='buyer2@example.com',
            password='testpass',
            role='BUYER'
        )
        self.buyer_profile = BuyerProfile.objects.create(
            user=self.buyer,
            age=28,
            bussiness_license_image='test.jpg'
        )

        self.order = Order.objects.create(
            buyer=self.buyer_profile,
            farm=self.farm,
            total_price=5.0,
            status='delivered'
        )

        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=5.0
        )

    def test_admin_dashboard_data(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass'
        )

        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/dashboard/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['role'], 'ADMIN')
        self.assertEqual(response.data['data']['total_users'], User.objects.count())
        self.assertEqual(response.data['data']['total_products'], Product.objects.count())
        self.assertEqual(response.data['data']['total_orders'], Order.objects.count())
        self.assertGreaterEqual(response.data['data']['total_revenue'], 0)

