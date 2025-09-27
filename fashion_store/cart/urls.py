from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_cart_view, name='get-cart'),
    path('add/', views.add_to_cart_view, name='add-to-cart'),
    path('items/<int:item_id>/update/', views.update_cart_item_view, name='update-cart-item'),
    path('items/<int:item_id>/remove/', views.remove_from_cart_view, name='remove-from-cart'),
    path('clear/', views.clear_cart_view, name='clear-cart'),
    path('apply-discount/', views.apply_discount_view, name='apply-discount'),
]