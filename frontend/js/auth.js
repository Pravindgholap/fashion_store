// Authentication Functions

function checkAuth() {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const userMenu = document.getElementById('userMenu');
    const authMenu = document.getElementById('authMenu');
    const userName = document.getElementById('userName');
    
    if (token && user.email) {
        if (userMenu) userMenu.style.display = 'block';
        if (authMenu) authMenu.style.display = 'none';
        if (userName) userName.textContent = user.first_name || user.username || 'User';
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authMenu) authMenu.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Login Form Handler
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
        showAlert('An error occurred during login', 'danger');
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
});

// Signup Form Handler
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

// Forgot Password Form Handler
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const spinner = document.getElementById('forgotSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Password reset instructions sent to your email', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            modal.hide();
        } else {
            showAlert(data.error || 'Failed to send reset email', 'danger');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showAlert('An error occurred', 'danger');
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
});