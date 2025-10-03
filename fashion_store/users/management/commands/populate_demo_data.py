from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from users.models import CustomUser, UserAddress
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
        UserAddress.objects.all().delete()
        
        # Create demo users
        self.create_demo_users()
        
        # Create user addresses
        self.create_user_addresses()
        
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
            {
                'username': 'john_doe', 
                'email': 'john@example.com', 
                'first_name': 'John', 
                'last_name': 'Doe', 
                'phone': '+91-9876543210',
                'address': '123 Main Street, Mumbai'
            },
            {
                'username': 'jane_smith', 
                'email': 'jane@example.com', 
                'first_name': 'Jane', 
                'last_name': 'Smith', 
                'phone': '+91-9876543211',
                'address': '456 Park Avenue, Delhi'
            },
            {
                'username': 'mike_wilson', 
                'email': 'mike@example.com', 
                'first_name': 'Mike', 
                'last_name': 'Wilson', 
                'phone': '+91-9876543212',
                'address': '789 Beach Road, Goa'
            },
        ]
        
        self.demo_users = []
        for user_data in demo_users:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['username'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'phone': user_data['phone'],
                    'address': user_data['address'],
                    'is_active': True
                }
            )
            if created:
                user.set_password('demo123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'User {user_data["email"]} created'))
            self.demo_users.append(user)

    def create_user_addresses(self):
        self.stdout.write('Creating user addresses...')
        
        addresses_data = [
            # John's addresses
            [
                {
                    'label': 'Home',
                    'full_name': 'John Doe',
                    'phone': '+91-9876543210',
                    'address_line1': '123 Main Street',
                    'address_line2': 'Apartment 4B',
                    'city': 'Mumbai',
                    'state': 'Maharashtra',
                    'postal_code': '400001',
                    'country': 'India',
                    'is_default': True
                },
                {
                    'label': 'Office',
                    'full_name': 'John Doe',
                    'phone': '+91-9876543210',
                    'address_line1': '456 Business Park',
                    'address_line2': 'Tower B, Floor 5',
                    'city': 'Mumbai',
                    'state': 'Maharashtra',
                    'postal_code': '400051',
                    'country': 'India',
                    'is_default': False
                }
            ],
            # Jane's addresses
            [
                {
                    'label': 'Home',
                    'full_name': 'Jane Smith',
                    'phone': '+91-9876543211',
                    'address_line1': '456 Park Avenue',
                    'address_line2': 'Villa 12',
                    'city': 'Delhi',
                    'state': 'Delhi',
                    'postal_code': '110001',
                    'country': 'India',
                    'is_default': True
                },
            ],
            # Mike's addresses
            [
                {
                    'label': 'Beach House',
                    'full_name': 'Mike Wilson',
                    'phone': '+91-9876543212',
                    'address_line1': '789 Beach Road',
                    'address_line2': 'Near Lighthouse',
                    'city': 'Panaji',
                    'state': 'Goa',
                    'postal_code': '403001',
                    'country': 'India',
                    'is_default': True
                }
            ]
        ]
        
        for user, user_addresses in zip(self.demo_users, addresses_data):
            for address_data in user_addresses:
                UserAddress.objects.create(user=user, **address_data)

    def create_categories(self):
        self.stdout.write('Creating categories...')
        
        # Updated category names to match the actual downloaded images
        categories_data = [
            {
                'name': "Men's Fashion",
                'description': 'Trendy clothing for men',
                'image': 'categories/mens.jpg'
            },
            {
                'name': "Women's Fashion", 
                'description': 'Stylish clothing for women',
                'image': 'categories/womens.jpg'
            },
            {
                'name': "Kids' Fashion",
                'description': 'Fun clothing for children',
                'image': 'categories/kids.jpg'
            },
            {
                'name': 'Footwear',
                'description': 'Shoes for all occasions',
                'image': 'categories/footwear.jpg'
            },
            {
                'name': 'Accessories',
                'description': 'Fashion accessories',
                'image': 'categories/accessories.jpg'
            },
        ]
        
        self.categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'image': cat_data['image']
                }
            )
            self.categories.append(category)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Category "{cat_data["name"]}" created with image'))

    def create_products(self):
        self.stdout.write('Creating products...')
        
        # Updated products to match actual downloaded image files
        products_data = [
            # Men's Clothing Products
            {
                'name': 'Classic Men\'s Shirt',
                'description': 'Premium cotton formal shirt for men with perfect fit and comfort',
                'category': self.categories[0],  # Men's Fashion
                'price': Decimal('1899.00'),
                'discount_price': Decimal('1499.00'),
                'gender': 'men',
                'brand': 'Premium Classics',
                'material': '100% Cotton',
                'is_featured': True,
                'images': ['products/mens_shirt1.jpg'],
                'variants': [
                    {'size': 'S', 'color': 'White', 'stock': 15},
                    {'size': 'M', 'color': 'White', 'stock': 20},
                    {'size': 'L', 'color': 'White', 'stock': 12},
                    {'size': 'XL', 'color': 'White', 'stock': 8},
                ]
            },
            {
                'name': 'Casual Men\'s T-Shirt',
                'description': 'Comfortable cotton t-shirt perfect for casual wear',
                'category': self.categories[0],
                'price': Decimal('899.00'),
                'discount_price': Decimal('699.00'),
                'gender': 'men',
                'brand': 'Urban Comfort',
                'material': 'Cotton Blend',
                'is_featured': False,
                'images': ['products/mens_shirt2.jpg'],
                'variants': [
                    {'size': 'S', 'color': 'Black', 'stock': 25},
                    {'size': 'M', 'color': 'Black', 'stock': 30},
                    {'size': 'L', 'color': 'Black', 'stock': 20},
                ]
            },
            {
                'name': 'Premium Leather Jacket',
                'description': 'Stylish leather jacket for modern gentlemen',
                'category': self.categories[0],
                'price': Decimal('5999.00'),
                'discount_price': Decimal('4999.00'),
                'gender': 'men',
                'brand': 'Urban Style',
                'material': 'Genuine Leather',
                'is_featured': True,
                'images': ['products/mens_jacket1.jpg'],
                'variants': [
                    {'size': 'M', 'color': 'Black', 'stock': 10},
                    {'size': 'L', 'color': 'Black', 'stock': 15},
                    {'size': 'XL', 'color': 'Black', 'stock': 8},
                ]
            },
            {
                'name': 'Men\'s Denim Jeans',
                'description': 'Classic blue denim jeans with perfect fit',
                'category': self.categories[0],
                'price': Decimal('2299.00'),
                'discount_price': Decimal('1899.00'),
                'gender': 'men',
                'brand': 'Denim Co.',
                'material': 'Denim',
                'is_featured': False,
                'images': ['products/mens_pants1.jpg'],
                'variants': [
                    {'size': '30', 'color': 'Blue', 'stock': 18},
                    {'size': '32', 'color': 'Blue', 'stock': 22},
                    {'size': '34', 'color': 'Blue', 'stock': 16},
                ]
            },
            {
                'name': 'Formal Business Suit',
                'description': 'Elegant business suit for professional occasions',
                'category': self.categories[0],
                'price': Decimal('8999.00'),
                'discount_price': Decimal('7499.00'),
                'gender': 'men',
                'brand': 'Executive Wear',
                'material': 'Wool Blend',
                'is_featured': True,
                'images': ['products/mens_suit1.jpg'],
                'variants': [
                    {'size': 'M', 'color': 'Navy', 'stock': 8},
                    {'size': 'L', 'color': 'Navy', 'stock': 10},
                    {'size': 'XL', 'color': 'Black', 'stock': 6},
                ]
            },
            
            # Women's Clothing Products
            {
                'name': 'Elegant Floral Dress',
                'description': 'Beautiful floral print dress perfect for any occasion',
                'category': self.categories[1],  # Women's Fashion
                'price': Decimal('2999.00'),
                'discount_price': Decimal('2399.00'),
                'gender': 'women',
                'brand': 'Fashion Trends',
                'material': 'Cotton Blend',
                'is_featured': True,
                'images': ['products/womens_dress1.jpg'],
                'variants': [
                    {'size': 'S', 'color': 'Floral', 'stock': 12},
                    {'size': 'M', 'color': 'Floral', 'stock': 18},
                    {'size': 'L', 'color': 'Floral', 'stock': 10},
                ]
            },
            {
                'name': 'Party Evening Dress',
                'description': 'Stunning evening dress for special occasions',
                'category': self.categories[1],
                'price': Decimal('4599.00'),
                'discount_price': Decimal('3899.00'),
                'gender': 'women',
                'brand': 'Glamour Nights',
                'material': 'Satin',
                'is_featured': True,
                'images': ['products/womens_dress2.jpg'],
                'variants': [
                    {'size': 'S', 'color': 'Black', 'stock': 8},
                    {'size': 'M', 'color': 'Black', 'stock': 12},
                    {'size': 'L', 'color': 'Navy', 'stock': 6},
                ]
            },
            {
                'name': 'Women\'s Casual Top',
                'description': 'Comfortable and stylish top for everyday wear',
                'category': self.categories[1],
                'price': Decimal('1299.00'),
                'discount_price': Decimal('999.00'),
                'gender': 'women',
                'brand': 'Casual Comfort',
                'material': 'Cotton',
                'is_featured': False,
                'images': ['products/womens_top1.jpg'],
                'variants': [
                    {'size': 'S', 'color': 'White', 'stock': 20},
                    {'size': 'M', 'color': 'Pink', 'stock': 25},
                    {'size': 'L', 'color': 'White', 'stock': 15},
                ]
            },
            {
                'name': 'Women\'s A-Line Skirt',
                'description': 'Elegant A-line skirt perfect for office and parties',
                'category': self.categories[1],
                'price': Decimal('1799.00'),
                'discount_price': Decimal('1499.00'),
                'gender': 'women',
                'brand': 'Style Statement',
                'material': 'Polyester',
                'is_featured': False,
                'images': ['products/womens_skirt1.jpg'],
                'variants': [
                    {'size': 'S', 'color': 'Black', 'stock': 14},
                    {'size': 'M', 'color': 'Black', 'stock': 18},
                    {'size': 'L', 'color': 'Navy', 'stock': 12},
                ]
            },
            {
                'name': 'Women\'s Skinny Jeans',
                'description': 'Comfortable skinny jeans with perfect stretch',
                'category': self.categories[1],
                'price': Decimal('2499.00'),
                'discount_price': Decimal('1999.00'),
                'gender': 'women',
                'brand': 'Denim Queen',
                'material': 'Denim with Elastane',
                'is_featured': True,
                'images': ['products/womens_jeans1.jpg'],
                'variants': [
                    {'size': '28', 'color': 'Blue', 'stock': 16},
                    {'size': '30', 'color': 'Blue', 'stock': 20},
                    {'size': '32', 'color': 'Black', 'stock': 14},
                ]
            },
            
            # Kids' Products
            {
                'name': 'Kids Cartoon T-Shirt',
                'description': 'Fun cartoon printed t-shirt for children',
                'category': self.categories[2],  # Kids' Fashion
                'price': Decimal('599.00'),
                'discount_price': Decimal('449.00'),
                'gender': 'kids',
                'brand': 'Kids Fun',
                'material': 'Cotton',
                'is_featured': False,
                'images': ['products/kids_tshirt1.jpg'],
                'variants': [
                    {'size': '4-5Y', 'color': 'Blue', 'stock': 25},
                    {'size': '6-7Y', 'color': 'Blue', 'stock': 30},
                    {'size': '8-9Y', 'color': 'Red', 'stock': 20},
                ]
            },
            {
                'name': 'Girls Party Dress',
                'description': 'Beautiful dress for little princesses',
                'category': self.categories[2],
                'price': Decimal('1299.00'),
                'discount_price': Decimal('999.00'),
                'gender': 'kids',
                'brand': 'Little Princess',
                'material': 'Cotton Blend',
                'is_featured': True,
                'images': ['products/kids_dress1.jpg'],
                'variants': [
                    {'size': '3-4Y', 'color': 'Pink', 'stock': 18},
                    {'size': '5-6Y', 'color': 'Pink', 'stock': 22},
                    {'size': '7-8Y', 'color': 'Purple', 'stock': 15},
                ]
            },
            
            # Footwear Products
            {
                'name': 'Men\'s Formal Shoes',
                'description': 'Premium leather formal shoes for men',
                'category': self.categories[3],  # Footwear
                'price': Decimal('3499.00'),
                'discount_price': Decimal('2899.00'),
                'gender': 'men',
                'brand': 'Elite Footwear',
                'material': 'Genuine Leather',
                'is_featured': True,
                'images': ['products/mens_shoes1.jpg'],
                'variants': [
                    {'size': '8', 'color': 'Black', 'stock': 15},
                    {'size': '9', 'color': 'Black', 'stock': 20},
                    {'size': '10', 'color': 'Brown', 'stock': 12},
                ]
            },
            {
                'name': 'Women\'s High Heels',
                'description': 'Elegant high heels for women',
                'category': self.categories[3],
                'price': Decimal('2799.00'),
                'discount_price': Decimal('2299.00'),
                'gender': 'women',
                'brand': 'Glamour Heels',
                'material': 'Synthetic Leather',
                'is_featured': True,
                'images': ['products/womens_heels1.jpg'],
                'variants': [
                    {'size': '6', 'color': 'Black', 'stock': 18},
                    {'size': '7', 'color': 'Black', 'stock': 22},
                    {'size': '8', 'color': 'Nude', 'stock': 16},
                ]
            },
            {
                'name': 'Casual Sneakers',
                'description': 'Comfortable sneakers for everyday wear',
                'category': self.categories[3],
                'price': Decimal('1999.00'),
                'discount_price': Decimal('1599.00'),
                'gender': 'unisex',
                'brand': 'Urban Steps',
                'material': 'Canvas',
                'is_featured': False,
                'images': ['products/sneakers1.jpg'],
                'variants': [
                    {'size': '7', 'color': 'White', 'stock': 25},
                    {'size': '8', 'color': 'White', 'stock': 30},
                    {'size': '9', 'color': 'Black', 'stock': 20},
                ]
            },
            
            # Accessories Products
            {
                'name': 'Designer Handbag',
                'description': 'Luxury designer handbag with premium finish',
                'category': self.categories[4],  # Accessories
                'price': Decimal('4599.00'),
                'discount_price': Decimal('3799.00'),
                'gender': 'women',
                'brand': 'Luxury Bags',
                'material': 'Faux Leather',
                'is_featured': True,
                'images': ['products/handbag1.jpg'],
                'variants': [
                    {'size': 'One Size', 'color': 'Black', 'stock': 20},
                    {'size': 'One Size', 'color': 'Brown', 'stock': 15},
                ]
            },
            {
                'name': 'Premium Watch',
                'description': 'Elegant wristwatch for men and women',
                'category': self.categories[4],
                'price': Decimal('5999.00'),
                'discount_price': Decimal('4999.00'),
                'gender': 'unisex',
                'brand': 'Time Masters',
                'material': 'Stainless Steel',
                'is_featured': True,
                'images': ['products/watch1.jpg'],
                'variants': [
                    {'size': 'One Size', 'color': 'Silver', 'stock': 12},
                    {'size': 'One Size', 'color': 'Black', 'stock': 10},
                    {'size': 'One Size', 'color': 'Gold', 'stock': 8},
                ]
            },
            {
                'name': 'Designer Sunglasses',
                'description': 'Stylish sunglasses with UV protection',
                'category': self.categories[4],
                'price': Decimal('1899.00'),
                'discount_price': Decimal('1499.00'),
                'gender': 'unisex',
                'brand': 'Sun Style',
                'material': 'Acetate',
                'is_featured': False,
                'images': ['products/sunglasses1.jpg'],
                'variants': [
                    {'size': 'One Size', 'color': 'Black', 'stock': 25},
                    {'size': 'One Size', 'color': 'Brown', 'stock': 20},
                ]
            },
        ]
        
        self.products = []
        for product_data in products_data:
            variants_data = product_data.pop('variants')
            images_data = product_data.pop('images', [])
            
            product = Product.objects.create(**product_data)
            self.products.append(product)
            
            # Create product images
            for idx, image_path in enumerate(images_data):
                ProductImage.objects.create(
                    product=product,
                    image=image_path,
                    is_primary=(idx == 0)
                )
            
            # Create variants
            for i, variant_data in enumerate(variants_data):
                ProductVariant.objects.create(
                    product=product,
                    size=variant_data['size'],
                    color=variant_data['color'],
                    stock_quantity=variant_data['stock'],
                    sku=f"{product.id}-{variant_data['size']}-{variant_data['color']}-{i+1:03d}".replace(' ', '')
                )
            
            self.stdout.write(self.style.SUCCESS(
                f'Product "{product.name}" created with {len(images_data)} image(s)'
            ))

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
            {
                'code': 'FASHION25',
                'discount_percent': Decimal('25.00'),
                'min_order_amount': Decimal('5000.00'),
                'max_uses': 25,
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
        
        if not self.demo_users or not self.products:
            self.stdout.write(self.style.WARNING('No users or products available'))
            return
        
        john = self.demo_users[0]
        jane = self.demo_users[1]
        mike = self.demo_users[2]
        
        john_home = UserAddress.objects.filter(user=john, label='Home').first()
        jane_home = UserAddress.objects.filter(user=jane, label='Home').first()
        mike_home = UserAddress.objects.filter(user=mike, label='Beach House').first()
        
        orders_data = [
            {
                'user': john,
                'saved_address': john_home,
                'status': 'delivered',
                'payment_method': 'card',
                'payment_status': 'completed',
                'products': [
                    {'product_idx': 0, 'quantity': 2},  # Men's Shirt
                    {'product_idx': 16, 'quantity': 1}, # Men's Formal Shoes
                ]
            },
            {
                'user': jane,
                'saved_address': jane_home,
                'status': 'shipped',
                'payment_method': 'upi',
                'payment_status': 'completed',
                'products': [
                    {'product_idx': 5, 'quantity': 1},  # Floral Dress
                    {'product_idx': 17, 'quantity': 1}, # Women's Heels
                ]
            },
            {
                'user': mike,
                'saved_address': mike_home,
                'status': 'processing',
                'payment_method': 'card',
                'payment_status': 'completed',
                'products': [
                    {'product_idx': 2, 'quantity': 1},  # Leather Jacket
                    {'product_idx': 18, 'quantity': 1}, # Sneakers
                ]
            },
        ]
        
        for order_data in orders_data:
            user = order_data['user']
            saved_address = order_data.get('saved_address')
            
            subtotal = Decimal('0.00')
            order_items = []
            
            for item_data in order_data['products']:
                product = self.products[item_data['product_idx']]
                variant = product.variants.first()
                quantity = item_data['quantity']
                price = product.current_price
                
                subtotal += price * quantity
                order_items.append({
                    'variant': variant,
                    'quantity': quantity,
                    'price': price
                })
            
            shipping_cost = Decimal('0.00') if subtotal >= 500 else Decimal('50.00')
            tax_amount = subtotal * Decimal('0.18')
            total_amount = subtotal + shipping_cost + tax_amount
            
            order_kwargs = {
                'user': user,
                'status': order_data['status'],
                'payment_method': order_data['payment_method'],
                'payment_status': order_data.get('payment_status', 'pending'),
                'subtotal': subtotal,
                'shipping_cost': shipping_cost,
                'tax_amount': tax_amount,
                'total_amount': total_amount,
            }
            
            if saved_address:
                order_kwargs.update({
                    'saved_address': saved_address,
                    'shipping_name': saved_address.full_name,
                    'shipping_email': user.email,
                    'shipping_phone': saved_address.phone,
                    'shipping_address_line1': saved_address.address_line1,
                    'shipping_address_line2': saved_address.address_line2,
                    'shipping_city': saved_address.city,
                    'shipping_state': saved_address.state,
                    'shipping_postal_code': saved_address.postal_code,
                    'shipping_country': saved_address.country,
                })
            
            order = Order.objects.create(**order_kwargs)
            
            for item in order_items:
                OrderItem.objects.create(
                    order=order,
                    product_variant=item['variant'],
                    quantity=item['quantity'],
                    price=item['price']
                )
            
            # Create order tracking
            OrderTracking.objects.create(
                order=order,
                status=order.status,
                message=f'Order {order.status}',
                created_at=timezone.now()
            )
            
            self.stdout.write(self.style.SUCCESS(
                f'Order {order.order_number} created for {user.email}'
            ))