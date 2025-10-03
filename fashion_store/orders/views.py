from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal
from .models import Order, OrderItem, OrderTracking, UserAddress
from cart.models import Cart, DiscountCode
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, CreateOrderSerializer,
    UpdateOrderStatusSerializer
)

class OrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order_view(request):
    # Get user's cart
    try:
        cart = Cart.objects.get(user=request.user)
        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = CreateOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle saved address
    shipping_data = {}
    if request.data.get('use_saved_address'):
        address_id = request.data.get('saved_address_id')
        try:
            address = UserAddress.objects.get(id=address_id, user=request.user)
            shipping_data = {
                'saved_address': address,
                'shipping_name': address.full_name,
                'shipping_email': request.user.email,
                'shipping_phone': address.phone,
                'shipping_address_line1': address.address_line1,
                'shipping_address_line2': address.address_line2,
                'shipping_city': address.city,
                'shipping_state': address.state,
                'shipping_postal_code': address.postal_code,
                'shipping_country': address.country,
            }
        except UserAddress.DoesNotExist:
            return Response({'error': 'Saved address not found'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        # Use manual entry
        validated_data = serializer.validated_data.copy()
        validated_data.pop('use_saved_address', None)
        validated_data.pop('saved_address_id', None)
        shipping_data = validated_data
    
    # Check stock availability
    for cart_item in cart.items.all():
        if cart_item.product_variant.stock_quantity < cart_item.quantity:
            return Response({
                'error': f'Insufficient stock for {cart_item.product_variant.product.name}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        # Calculate totals
        subtotal = cart.total_price
        shipping_cost = Decimal('50.00') if subtotal < 500 else Decimal('0.00')  # Free shipping over 500
        tax_amount = subtotal * Decimal('0.18')  # 18% GST
        
        # Apply discount if provided
        discount_amount = Decimal('0.00')
        discount_code_obj = None
        discount_code = request.data.get('discount_code')
        
        if discount_code:
            try:
                discount_code_obj = DiscountCode.objects.get(code=discount_code)
                if discount_code_obj.is_valid and subtotal >= discount_code_obj.min_order_amount:
                    discount_amount = discount_code_obj.calculate_discount(subtotal)
                    discount_code_obj.used_count += 1
                    discount_code_obj.save()
            except DiscountCode.DoesNotExist:
                pass
        
        total_amount = subtotal + shipping_cost + tax_amount - discount_amount
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            subtotal=subtotal,
            discount_code=discount_code_obj,
            discount_amount=discount_amount,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            total_amount=total_amount,
            payment_method=request.data.get('payment_method'),
            **shipping_data
        )
        
        # Create order items and update stock
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product_variant=cart_item.product_variant,
                quantity=cart_item.quantity,
                price=cart_item.product_variant.product.current_price
            )
            
            # Update stock
            cart_item.product_variant.stock_quantity -= cart_item.quantity
            cart_item.product_variant.save()
        
        # Clear cart
        cart.items.all().delete()
        
        # Create initial tracking update
        OrderTracking.objects.create(
            order=order,
            status='pending',
            message='Order placed successfully'
        )
    
    return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)

# Admin Views
class AdminOrderListView(generics.ListAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderListSerializer
    permission_classes = [IsAdminUser]

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_order_status_view(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    serializer = UpdateOrderStatusSerializer(data=request.data)
    
    if serializer.is_valid():
        old_status = order.status
        new_status = serializer.validated_data['status']
        tracking_number = serializer.validated_data.get('tracking_number', '')
        message = serializer.validated_data.get('message', f'Order status updated to {new_status}')
        
        # Update order
        order.status = new_status
        if tracking_number:
            order.tracking_number = tracking_number
        order.save()
        
        # Create tracking update
        OrderTracking.objects.create(
            order=order,
            status=new_status,
            message=message
        )
        
        return Response(OrderDetailSerializer(order).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def track_order_view(request, order_number):
    try:
        order = Order.objects.get(order_number=order_number, user=request.user)
        return Response(OrderDetailSerializer(order).data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)