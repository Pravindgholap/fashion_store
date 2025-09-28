# from rest_framework import serializers
# from .models import Cart, CartItem, DiscountCode
# from products.serializers import ProductListSerializer

# class CartItemSerializer(serializers.ModelSerializer):
#     product = ProductListSerializer(source='product_variant.product', read_only=True)
#     size = serializers.CharField(source='product_variant.size', read_only=True)
#     color = serializers.CharField(source='product_variant.color', read_only=True)
#     subtotal = serializers.ReadOnlyField()
    
#     class Meta:
#         model = CartItem
#         fields = ['id', 'product', 'size', 'color', 'quantity', 'subtotal']

# class CartSerializer(serializers.ModelSerializer):
#     items = CartItemSerializer(many=True, read_only=True)
#     total_items = serializers.ReadOnlyField()
#     total_price = serializers.ReadOnlyField()
    
#     class Meta:
#         model = Cart
#         fields = ['id', 'items', 'total_items', 'total_price', 'updated_at']

# class AddToCartSerializer(serializers.Serializer):
#     product_variant_id = serializers.IntegerField()
#     quantity = serializers.IntegerField(min_value=1)

# class UpdateCartItemSerializer(serializers.Serializer):
#     quantity = serializers.IntegerField(min_value=1)

# class DiscountCodeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = DiscountCode
#         fields = ['code', 'discount_percent', 'discount_amount', 'min_order_amount']

# class ApplyDiscountSerializer(serializers.Serializer):
#     discount_code = serializers.CharField(max_length=50)


from rest_framework import serializers
from .models import Cart, CartItem, DiscountCode
from products.serializers import ProductListSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()  # Changed to SerializerMethodField
    color = serializers.SerializerMethodField()  # Changed to SerializerMethodField
    subtotal = serializers.ReadOnlyField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product_variant', 'product_name', 'product_price', 'product_image', 'size', 'color', 'quantity', 'subtotal']
    
    def get_product_name(self, obj):
        return obj.product_variant.product.name
    
    def get_product_price(self, obj):
        return obj.product_variant.product.current_price
    
    def get_product_image(self, obj):
        # Get the first product image
        if obj.product_variant.product.images.exists():
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(
                    obj.product_variant.product.images.first().image.url
                )
            return obj.product_variant.product.images.first().image.url
        return None
    
    def get_size(self, obj):
        # Directly access the CharField value
        return obj.product_variant.size
    
    def get_color(self, obj):
        # Directly access the CharField value
        return obj.product_variant.color

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    total_price = serializers.ReadOnlyField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'total_price', 'updated_at']

class AddToCartSerializer(serializers.Serializer):
    product_variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

class DiscountCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCode
        fields = ['code', 'discount_percent', 'discount_amount', 'min_order_amount']

class ApplyDiscountSerializer(serializers.Serializer):
    discount_code = serializers.CharField(max_length=50)