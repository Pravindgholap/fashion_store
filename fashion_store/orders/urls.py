from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('create/', views.create_order_view, name='create-order'),
    path('track/<str:order_number>/', views.track_order_view, name='track-order'),
    
    # Admin URLs
    path('admin/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/<int:order_id>/update-status/', views.update_order_status_view, name='update-order-status'),
]