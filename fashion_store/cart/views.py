from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from .models import Cart, CartItem, DiscountCode
from products.models import ProductVariant
from .serializers import (
    CartSerializer, AddToCartSerializer, UpdateCartItemSerializer,
    DiscountCodeSerializer, ApplyDiscountSerializer
)
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

def validate_user_exists(user):
    """
    Validate that the user actually exists in the database
    """
    try:
        User.objects.get(id=user.id)
        return True
    except User.DoesNotExist:
        logger.error(f"User with ID {user.id} does not exist in database")
        return False
    except Exception as e:
        logger.error(f"Error validating user {user.id}: {str(e)}")
        return False

def get_or_create_user_cart(user):
    """
    Safely get or create cart for user with comprehensive error handling
    """
    try:
        # Validate user exists first
        if not validate_user_exists(user):
            raise ValueError(f"User with ID {user.id} does not exist")
        
        # Try to get existing cart first
        cart = Cart.objects.filter(user=user).first()
        if cart:
            logger.info(f"Retrieved existing cart {cart.id} for user {user.id}")
            return cart, False
        
        # Create new cart with atomic transaction
        with transaction.atomic():
            cart = Cart.objects.create(user=user)
            logger.info(f"Created new cart {cart.id} for user {user.id}")
            return cart, True
            
    except IntegrityError as e:
        logger.error(f"IntegrityError creating cart for user {user.id}: {str(e)}")
        
        # Try to get the cart again in case it was created by another process
        cart = Cart.objects.filter(user=user).first()
        if cart:
            logger.info(f"Retrieved cart {cart.id} after IntegrityError for user {user.id}")
            return cart, False
        
        # If we still can't get a cart, raise the error
        raise ValueError("Unable to create or retrieve cart due to database integrity error")
    
    except ValueError as e:
        logger.error(f"ValueError in get_or_create_user_cart: {str(e)}")
        raise e
    
    except Exception as e:
        logger.error(f"Unexpected error in get_or_create_user_cart for user {user.id}: {str(e)}")
        raise ValueError("Unexpected error occurred while managing cart")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart_view(request):
    """
    Get user's cart with improved error handling
    """
    try:
        # Validate user authentication
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        logger.info(f"Getting cart for user {request.user.id}")
        cart, created = get_or_create_user_cart(request.user)
        
        serializer = CartSerializer(cart, context={'request': request})
        
        if created:
            logger.info(f"New cart created for user {request.user.id}")
        
        return Response(serializer.data)
        
    except ValueError as e:
        logger.error(f"ValueError in get_cart_view for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Unable to access cart. Please login again.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"Unexpected error in get_cart_view for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve cart'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart_view(request):
    """
    Add item to cart with comprehensive error handling
    """
    # Validate request data first
    serializer = AddToCartSerializer(data=request.data)
    if not serializer.is_valid():
        logger.error(f"Invalid data in add_to_cart_view: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    product_variant_id = serializer.validated_data['product_variant_id']
    quantity = serializer.validated_data['quantity']
    
    try:
        # Validate user authentication
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        logger.info(f"Add to cart - User: {request.user.id}, Variant: {product_variant_id}, Qty: {quantity}")
        
        # Get product variant with error handling
        try:
            product_variant = ProductVariant.objects.select_related('product').get(id=product_variant_id)
        except ProductVariant.DoesNotExist:
            logger.error(f"Product variant {product_variant_id} not found")
            return Response(
                {'error': 'Product variant not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check stock availability
        if product_variant.stock_quantity < quantity:
            logger.warning(f"Insufficient stock for variant {product_variant_id}: requested {quantity}, available {product_variant.stock_quantity}")
            return Response(
                {'error': f'Only {product_variant.stock_quantity} items available in stock'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create cart with comprehensive error handling
        try:
            cart, cart_created = get_or_create_user_cart(request.user)
        except ValueError as e:
            logger.error(f"Cart creation failed for user {request.user.id}: {str(e)}")
            return Response(
                {'error': 'Unable to access your cart. Please logout and login again.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add or update cart item
        with transaction.atomic():
            cart_item, item_created = CartItem.objects.get_or_create(
                cart=cart,
                product_variant=product_variant,
                defaults={'quantity': quantity}
            )
            
            if not item_created:
                # Update existing cart item
                new_quantity = cart_item.quantity + quantity
                if product_variant.stock_quantity < new_quantity:
                    return Response(
                        {'error': f'Only {product_variant.stock_quantity} items available in stock'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.quantity = new_quantity
                cart_item.save()
                logger.info(f"Updated cart item {cart_item.id} - New quantity: {cart_item.quantity}")
            else:
                logger.info(f"Created new cart item {cart_item.id}")
        
        # Return updated cart
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_201_CREATED)
        
    except IntegrityError as e:
        logger.error(f"IntegrityError in add_to_cart_view for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Unable to add item to cart. Please logout and login again.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"Unexpected error in add_to_cart_view for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to add item to cart'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item_view(request, item_id):
    """
    Update cart item quantity with error handling
    """
    try:
        cart_item = CartItem.objects.select_related('product_variant', 'cart').get(
            id=item_id, 
            cart__user=request.user
        )
    except CartItem.DoesNotExist:
        logger.error(f"Cart item {item_id} not found for user {request.user.id}")
        return Response(
            {'error': 'Cart item not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = UpdateCartItemSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    quantity = serializer.validated_data['quantity']
    
    try:
        with transaction.atomic():
            if quantity <= 0:
                # Remove the item if quantity is 0 or negative
                cart = cart_item.cart
                cart_item.delete()
                logger.info(f"Removed cart item {item_id} for user {request.user.id}")
                
                cart_serializer = CartSerializer(cart, context={'request': request})
                return Response(cart_serializer.data)
            
            # Check stock availability
            if cart_item.product_variant.stock_quantity < quantity:
                return Response(
                    {'error': f'Only {cart_item.product_variant.stock_quantity} items available in stock'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update quantity
            cart_item.quantity = quantity
            cart_item.save()
            logger.info(f"Updated cart item {item_id} quantity to {quantity} for user {request.user.id}")
            
            cart_serializer = CartSerializer(cart_item.cart, context={'request': request})
            return Response(cart_serializer.data)
            
    except Exception as e:
        logger.error(f"Error updating cart item {item_id} for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to update cart item'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart_view(request, item_id):
    """
    Remove item from cart with error handling
    """
    try:
        with transaction.atomic():
            cart_item = CartItem.objects.select_related('cart').get(
                id=item_id, 
                cart__user=request.user
            )
            cart = cart_item.cart
            cart_item.delete()
            
            logger.info(f"Removed cart item {item_id} for user {request.user.id}")
            
            cart_serializer = CartSerializer(cart, context={'request': request})
            return Response(cart_serializer.data)
            
    except CartItem.DoesNotExist:
        logger.error(f"Cart item {item_id} not found for user {request.user.id}")
        return Response(
            {'error': 'Cart item not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error removing cart item {item_id} for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to remove cart item'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart_view(request):
    """
    Clear all items from cart with error handling
    """
    try:
        with transaction.atomic():
            cart = Cart.objects.get(user=request.user)
            items_count = cart.items.count()
            cart.items.all().delete()
            
            logger.info(f"Cleared {items_count} items from cart for user {request.user.id}")
            
            cart_serializer = CartSerializer(cart, context={'request': request})
            return Response(cart_serializer.data)
            
    except Cart.DoesNotExist:
        logger.info(f"No cart found for user {request.user.id} - returning empty cart message")
        return Response({'message': 'Cart is already empty'})
    
    except Exception as e:
        logger.error(f"Error clearing cart for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to clear cart'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_discount_view(request):
    """
    Apply discount code with error handling
    """
    serializer = ApplyDiscountSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    code = serializer.validated_data['discount_code']
    
    try:
        # Get discount code
        try:
            discount = DiscountCode.objects.get(code=code)
        except DiscountCode.DoesNotExist:
            return Response(
                {'error': 'Invalid discount code'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate discount
        if not discount.is_valid:
            return Response(
                {'error': 'Discount code is expired or inactive'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user's cart
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response(
                {'error': 'Cart is empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate minimum order amount
        cart_total = cart.total_price
        if cart_total < discount.min_order_amount:
            return Response({
                'error': f'Minimum order amount is ${discount.min_order_amount}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate discount
        discount_amount = discount.calculate_discount(cart_total)
        final_amount = cart_total - discount_amount
        
        logger.info(f"Applied discount {code} for user {request.user.id}: {discount_amount}")
        
        return Response({
            'discount_code': code,
            'original_amount': float(cart_total),
            'discount_amount': float(discount_amount),
            'final_amount': float(final_amount),
            'discount_type': 'percentage' if discount.discount_percent else 'fixed'
        })
        
    except Exception as e:
        logger.error(f"Error applying discount {code} for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to apply discount'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )