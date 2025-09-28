from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant, Review

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'stock_quantity', 'sku', 'is_in_stock']

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    current_price = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'discount_price', 'current_price',
            'category_name', 'gender', 'brand', 'primary_image',
            'average_rating', 'is_featured'
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request')
        
        # Try to get primary image first
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        
        # Fallback to first image
        first_image = obj.images.first()
        if first_image:
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        
        return None

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True, context={'request': None})
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    current_price = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = '__all__'
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Fix image URLs in the images array
        if data.get('images') and request:
            for image in data['images']:
                if image.get('image') and not image['image'].startswith('http'):
                    image['image'] = request.build_absolute_uri(image['image'])
        
        return data

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'