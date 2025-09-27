from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('', views.ProductListView.as_view(), name='product-list'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('create/', views.ProductCreateView.as_view(), name='product-create'),
    path('<int:pk>/update/', views.ProductUpdateView.as_view(), name='product-update'),
    path('<int:pk>/delete/', views.ProductDeleteView.as_view(), name='product-delete'),
    path('featured/', views.featured_products_view, name='featured-products'),
    path('trending/', views.trending_products_view, name='trending-products'),
    path('<int:product_id>/reviews/', views.add_review_view, name='add-review'),
    path('<int:product_id>/outfit-suggestions/', views.outfit_suggestions_view, name='outfit-suggestions'),
]