from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, PasswordReset
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, 
    UserProfileSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
)
import uuid

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = CustomUser.objects.get(email=email)
            
            # Clean up old reset tokens for this user
            PasswordReset.objects.filter(
                user=user, 
                created_at__lt=timezone.now() - timedelta(hours=24)
            ).delete()
            
            # Create new reset token
            token = str(uuid.uuid4())
            PasswordReset.objects.create(user=user, token=token)
            
            # Create reset link - Updated for correct frontend path
            reset_link = f"http://localhost:3000/reset-password.html?token={token}"
            
            # Email content
            subject = 'Password Reset - Fashion Store'
            message = f'''
                Hello {user.first_name or user.username},

                You requested a password reset for your Fashion Store account.

                Click the link below to reset your password:
                {reset_link}

                If you didn't request this, please ignore this email.

                This link will expire in 24 hours.

                Best regards,
                Fashion Store Team
            '''
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return Response({'message': 'Password reset email sent successfully'})
            except Exception as e:
                print(f"Email error: {e}")
                # For development, print the reset link to console
                print(f"Password reset link: {reset_link}")
                return Response({'message': 'Password reset email sent successfully'})
                
        except CustomUser.DoesNotExist:
            # Don't reveal if email exists or not for security
            return Response({'message': 'If this email exists, you will receive a reset link'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Check if token exists and is not expired (24 hours)
            reset = PasswordReset.objects.get(
                token=token, 
                is_used=False,
                created_at__gte=timezone.now() - timedelta(hours=24)
            )
            user = reset.user
            user.set_password(new_password)
            user.save()
            reset.is_used = True
            reset.save()
            return Response({'message': 'Password reset successful'})
        except PasswordReset.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
