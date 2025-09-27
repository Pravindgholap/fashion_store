from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, DiscountCode
from products.models import ProductVariant
from .serializers import (
    CartSerializer, AddToCartSerializer, UpdateCartItemSerializer,
    DiscountCodeSerializer, ApplyDiscountSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart_view(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart_view(request):
    serializer = AddToCartSerializer(data=request.data)
    if serializer.is_valid():
        product_variant_id = serializer.validated_data['product_variant_id']
        quantity = serializer.validated_data['quantity']
        
        try:
            product_variant = ProductVariant.objects.get(id=product_variant_id)
        except ProductVariant.DoesNotExist:
            return Response({'error': 'Product variant not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        if product_variant.stock_quantity < quantity:
            return Response({'error': 'Insufficient stock'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_variant=product_variant,
            defaults={'quantity': quantity}
        )
        
        if not created:
            # Update existing cart item
            new_quantity = cart_item.quantity + quantity
            if product_variant.stock_quantity < new_quantity:
                return Response({'error': 'Insufficient stock'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
            cart_item.save()
        
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item_view(request, item_id):
    try:
        cart_item = CartItem.objects.get(
            id=item_id, 
            cart__user=request.user
        )
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    serializer = UpdateCartItemSerializer(data=request.data)
    if serializer.is_valid():
        quantity = serializer.validated_data['quantity']
        
        if cart_item.product_variant.stock_quantity < quantity:
            return Response({'error': 'Insufficient stock'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        cart_item.quantity = quantity
        cart_item.save()
        
        cart_serializer = CartSerializer(cart_item.cart, context={'request': request})
        return Response(cart_serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart_view(request, item_id):
    try:
        cart_item = CartItem.objects.get(
            id=item_id, 
            cart__user=request.user
        )
        cart = cart_item.cart
        cart_item.delete()
        
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart_view(request):
    try:
        cart = Cart.objects.get(user=request.user)
        cart.items.all().delete()
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data)
    except Cart.DoesNotExist:
        return Response({'message': 'Cart is already empty'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_discount_view(request):
    serializer = ApplyDiscountSerializer(data=request.data)
    if serializer.is_valid():
        code = serializer.validated_data['discount_code']
        
        try:
            discount = DiscountCode.objects.get(code=code)
        except DiscountCode.DoesNotExist:
            return Response({'error': 'Invalid discount code'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if not discount.is_valid:
            return Response({'error': 'Discount code is expired or inactive'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if cart.total_price < discount.min_order_amount:
            return Response({
                'error': f'Minimum order amount is ${discount.min_order_amount}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        discount_amount = discount.calculate_discount(cart.total_price)
        final_amount = cart.total_price - discount_amount
        
        return Response({
            'discount_code': code,
            'original_amount': cart.total_price,
            'discount_amount': discount_amount,
            'final_amount': final_amount
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)