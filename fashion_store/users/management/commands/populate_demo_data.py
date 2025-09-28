from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from users.models import CustomUser
from products.models import Category, Product, ProductImage, ProductVariant, Review
from cart.models import DiscountCode
from orders.models import Order, OrderItem, OrderTracking

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with demo data for Fashion Store'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate demo data...'))
        
        # Clear existing data
        self.stdout.write('Clearing existing data...')
        OrderTracking.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        Review.objects.all().delete()
        ProductImage.objects.all().delete()
        ProductVariant.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        DiscountCode.objects.all().delete()
        
        # Create demo users
        self.create_demo_users()
        
        # Create categories
        self.create_categories()
        
        # Create products
        self.create_products()
        
        # Create discount codes
        self.create_discount_codes()
        
        # Create sample orders
        self.create_sample_orders()
        
        self.stdout.write(self.style.SUCCESS('Successfully populated demo data!'))

    def create_demo_users(self):
        self.stdout.write('Creating demo users...')
        
        # Admin user
        admin_user, created = User.objects.get_or_create(
            email='admin@fashionstore.com',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Admin user created'))
        
        # Demo customers
        demo_users = [
            {'username': 'john_doe', 'email': 'john@example.com', 'first_name': 'John', 'last_name': 'Doe', 'phone': '+91-9876543210'},
            {'username': 'jane_smith', 'email': 'jane@example.com', 'first_name': 'Jane', 'last_name': 'Smith', 'phone': '+91-9876543211'},
            {'username': 'mike_wilson', 'email': 'mike@example.com', 'first_name': 'Mike', 'last_name': 'Wilson', 'phone': '+91-9876543212'},
        ]
        
        for user_data in demo_users:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['username'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'phone': user_data['phone'],
                    'is_active': True
                }
            )
            if created:
                user.set_password('demo123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'User {user_data["email"]} created'))

    def create_categories(self):
        self.stdout.write('Creating categories...')
        
        categories_data = [
            {'name': "Men's Clothing", 'description': 'Trendy clothing for men'},
            {'name': "Women's Clothing", 'description': 'Stylish clothing for women'},
            {'name': "Kids' Clothing", 'description': 'Fun clothing for children'},
            {'name': 'Footwear', 'description': 'Shoes for all occasions'},
            {'name': 'Accessories', 'description': 'Fashion accessories'},
        ]
        
        self.categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            self.categories.append(category)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Category "{cat_data["name"]}" created'))

    def create_products(self):
        self.stdout.write('Creating products...')
        
        # Simple products data for demo
        products_data = [
            {
                'name': 'Classic Cotton T-Shirt',
                'description': 'Comfortable cotton t-shirt',
                'category': self.categories[0],  # Men's Clothing
                'price': Decimal('799.00'),
                'discount_price': Decimal('599.00'),
                'gender': 'men',
                'brand': 'Urban Style',
                'material': 'Cotton',
                'is_featured': True,
                'variants': [
                    {'size': 'M', 'color': 'Black', 'stock': 20},
                    {'size': 'L', 'color': 'White', 'stock': 15},
                ]
            },
            {
                'name': 'Floral Summer Dress',
                'description': 'Light floral dress',
                'category': self.categories[1],  # Women's Clothing
                'price': Decimal('2199.00'),
                'gender': 'women',
                'brand': 'Floral Trends',
                'material': 'Rayon',
                'is_featured': True,
                'variants': [
                    {'size': 'S', 'color': 'Pink', 'stock': 15},
                    {'size': 'M', 'color': 'Blue', 'stock': 18},
                ]
            },
        ]
        
        self.products = []
        for product_data in products_data:
            variants_data = product_data.pop('variants')
            
            product = Product.objects.create(**product_data)
            self.products.append(product)
            
            # Create variants
            for i, variant_data in enumerate(variants_data):
                ProductVariant.objects.create(
                    product=product,
                    size=variant_data['size'],
                    color=variant_data['color'],
                    stock_quantity=variant_data['stock'],
                    sku=f"{product.id}-{variant_data['size']}-{variant_data['color']}-{i+1:03d}"
                )
            
            self.stdout.write(self.style.SUCCESS(f'Product "{product.name}" created'))

    def create_discount_codes(self):
        self.stdout.write('Creating discount codes...')
        
        discount_codes = [
            {
                'code': 'WELCOME10',
                'discount_percent': Decimal('10.00'),
                'min_order_amount': Decimal('1000.00'),
                'max_uses': 100,
                'is_active': True,
            },
            {
                'code': 'SAVE20',
                'discount_percent': Decimal('20.00'),
                'min_order_amount': Decimal('2000.00'),
                'max_uses': 50,
                'is_active': True,
            },
        ]
        
        for code_data in discount_codes:
            DiscountCode.objects.create(
                **code_data,
                valid_from=timezone.now() - timedelta(days=30),
                valid_until=timezone.now() + timedelta(days=60)
            )
            self.stdout.write(self.style.SUCCESS(f'Discount code "{code_data["code"]}" created'))

    def create_sample_orders(self):
        self.stdout.write('Creating sample orders...')
        
        users = list(User.objects.filter(is_superuser=False))
        if not users:
            return
            
        # Create a simple order for demo
        user = users[0]
        product = self.products[0]
        variant = product.variants.first()
        
        order = Order.objects.create(
            user=user,
            status='delivered',
            shipping_name=f"{user.first_name} {user.last_name}",
            shipping_email=user.email,
            shipping_phone=user.phone,
            shipping_address_line1="123 Main Street",
            shipping_city="Mumbai",
            shipping_state="Maharashtra",
            shipping_postal_code="400001",
            payment_method='card',
            subtotal=product.current_price,
            shipping_cost=Decimal('0.00'),
            tax_amount=product.current_price * Decimal('0.18'),
            total_amount=product.current_price * Decimal('1.18'),
        )
        
        OrderItem.objects.create(
            order=order,
            product_variant=variant,
            quantity=1,
            price=product.current_price
        )
        
        self.stdout.write(self.style.SUCCESS('Sample order created'))