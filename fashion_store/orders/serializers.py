from rest_framework import serializers
from .models import Order, OrderItem, OrderTracking
from products.serializers import ProductListSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(source='product_variant.product', read_only=True)
    size = serializers.CharField(source='product_variant.size', read_only=True)
    color = serializers.CharField(source='product_variant.color', read_only=True)
    subtotal = serializers.ReadOnlyField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'size', 'color', 'quantity', 'price', 'subtotal']

class OrderTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderTracking
        fields = ['status', 'message', 'location', 'created_at']

class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'total_amount', 
            'items_count', 'created_at', 'estimated_delivery'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    tracking_updates = OrderTrackingSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'

class CreateOrderSerializer(serializers.ModelSerializer):
    use_saved_address = serializers.BooleanField(required=False, default=False)
    saved_address_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Order
        fields = [
            'use_saved_address', 'saved_address_id',
            'shipping_name', 'shipping_email', 'shipping_phone',
            'shipping_address_line1', 'shipping_address_line2',
            'shipping_city', 'shipping_state', 'shipping_postal_code',
            'payment_method'
        ]
    
    def validate(self, attrs):
        if attrs.get('use_saved_address'):
            if not attrs.get('saved_address_id'):
                raise serializers.ValidationError("saved_address_id is required when using saved address")
        return attrs

class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    message = serializers.CharField(required=False, allow_blank=True)