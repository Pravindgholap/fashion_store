from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('profile/', views.profile_view, name='profile'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('reset-password/', views.reset_password_view, name='reset_password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('addresses/', views.user_addresses_view, name='user-addresses'),
    path('addresses/<int:address_id>/', views.user_address_detail_view, name='user-address-detail'),
]