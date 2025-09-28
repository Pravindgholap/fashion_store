from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.core.paginator import Paginator
from .models import Category, Product, ProductVariant, Review
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer, ReviewSerializer
)

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True).order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'gender', 'brand']
    search_fields = ['name', 'description', 'brand']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('images', 'reviews')
        
        # Price range filter
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass
        
        # Size and color filters
        size = self.request.query_params.get('size')
        color = self.request.query_params.get('color')
        if size or color:
            variant_filter = Q()
            if size:
                variant_filter &= Q(variants__size=size)
            if color:
                variant_filter &= Q(variants__color=color)
            queryset = queryset.filter(variant_filter).distinct()
        
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related(
        'images', 'variants', 'reviews__user'
    )
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsAdminUser]

class ProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsAdminUser]

class ProductDeleteView(generics.DestroyAPIView):
    queryset = Product.objects.all()
    permission_classes = [IsAdminUser]

@api_view(['GET'])
@permission_classes([AllowAny])
def featured_products_view(request):
    try:
        products = Product.objects.filter(
            is_featured=True, 
            is_active=True
        ).select_related('category').prefetch_related('images', 'reviews')[:8]
        
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': 'Failed to load featured products'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def trending_products_view(request):
    try:
        # Simple trending logic - most recently added products
        products = Product.objects.filter(
            is_active=True
        ).select_related('category').prefetch_related('images', 'reviews').order_by('-created_at')[:8]
        
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': 'Failed to load trending products'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_review_view(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user already reviewed this product
    if Review.objects.filter(product=product, user=request.user).exists():
        return Response({'error': 'You have already reviewed this product'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user, product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def outfit_suggestions_view(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Simple suggestion logic - products from same category and gender
        suggestions = Product.objects.filter(
            category=product.category,
            gender=product.gender,
            is_active=True
        ).exclude(id=product_id).select_related('category').prefetch_related('images', 'reviews')[:4]
        
        serializer = ProductListSerializer(suggestions, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response([], status=status.HTTP_200_OK)