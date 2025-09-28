// auth.js - Enhanced version with token validation

async function validateToken() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
        // Test token with a simple API call
        const response = await fetch(`${API_BASE_URL}/auth/user/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            // Update stored user data
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
        } else {
            // Token is invalid, clear auth data
            clearAuthData();
            return false;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        clearAuthData();
        return false;
    }
}

function clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

async function checkAuth() {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const userMenu = document.getElementById('userMenu');
    const authMenu = document.getElementById('authMenu');
    const userName = document.getElementById('userName');
    
    if (token && user.email) {
        // Validate token periodically (every 5 minutes)
        const lastValidation = localStorage.getItem('last_token_validation');
        const now = Date.now();
        
        if (!lastValidation || (now - parseInt(lastValidation)) > 300000) {
            const isValid = await validateToken();
            if (!isValid) {
                // Redirect to login if token is invalid
                if (window.location.pathname !== '/login.html' && window.location.pathname !== '/index.html') {
                    window.location.href = 'login.html';
                    return;
                }
            } else {
                localStorage.setItem('last_token_validation', now.toString());
            }
        }
        
        if (userMenu) userMenu.style.display = 'block';
        if (authMenu) authMenu.style.display = 'none';
        if (userName) userName.textContent = user.first_name || user.username || 'User';
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authMenu) authMenu.style.display = 'block';
    }
}

function logout() {
    clearAuthData();
    localStorage.removeItem('last_token_validation');
    window.location.href = 'index.html';
}

// Enhanced request function with better error handling
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Handle authentication errors
        if (response.status === 401) {
            console.error('Authentication failed - clearing tokens');
            clearAuthData();
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('login.html')) {
                showAlert('Your session has expired. Please login again.', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
            throw new Error('Authentication failed');
        }
        
        // Handle user not found errors (foreign key constraint)
        if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('login again')) {
                console.error('User validation failed - clearing tokens');
                clearAuthData();
                showAlert('Please logout and login again.', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                throw new Error('User validation failed');
            }
        }
        
        return response;
        
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
}

// Login Form Handler with enhanced error handling
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const spinner = document.getElementById('loginSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('last_token_validation', Date.now().toString());
            
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            const errorMsg = data.non_field_errors?.[0] || data.error || 'Login failed';
            showAlert(errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login. Please try again.', 'danger');
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
});

// Signup Form Handler - unchanged but with clearAuthData on success
document.getElementById('signupForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        password_confirm: document.getElementById('confirmPassword').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value
    };
    
    const spinner = document.getElementById('signupSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Client-side validation
    if (formData.password !== formData.password_confirm) {
        showAlert('Passwords do not match', 'danger');
        return;
    }
    
    try {
        // Clear any existing auth data first
        clearAuthData();
        
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('last_token_validation', Date.now().toString());
            
            showAlert('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            let errorMsg = 'Registration failed';
            if (data.username) errorMsg = `Username: ${data.username[0]}`;
            else if (data.email) errorMsg = `Email: ${data.email[0]}`;
            else if (data.password) errorMsg = `Password: ${data.password[0]}`;
            else if (data.non_field_errors) errorMsg = data.non_field_errors[0];
            
            showAlert(errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('An error occurred during registration', 'danger');
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
});

// Forgot Password Form Handler - unchanged
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const spinner = document.getElementById('forgotSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        if (spinner) spinner.classList.remove('d-none');
        if (submitBtn) submitBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Password reset instructions sent to your email', 'success');
            const modalElement = document.getElementById('forgotPasswordModal');
            if (modalElement && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.hide();
            }
            e.target.reset();
        } else {
            showAlert(data.error || 'Failed to send reset email', 'danger');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showAlert('An error occurred. Please try again later.', 'danger');
    } finally {
        if (spinner) spinner.classList.add('d-none');
        if (submitBtn) submitBtn.disabled = false;
    }
});

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});