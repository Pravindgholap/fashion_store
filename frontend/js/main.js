// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Utility Functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('d-none');
}

function formatPrice(price) {
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
}

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function makeAuthenticatedRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshToken();
        if (refreshed) {
            // Retry the request with new token
            const newHeaders = {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                ...options.headers
            };
            return fetch(url, {
                ...options,
                headers: newHeaders
            });
        } else {
            // Refresh failed, redirect to login
            logout();
            return response;
        }
    }

    return response;
}

async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }

    return false;
}

// Product Functions
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/categories/`);
        const categories = await response.json();
        
        updateCategoriesDropdown(categories);
        updateCategoriesGrid(categories);
        updateCategoryFilter(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function updateCategoriesDropdown(categories) {
    const dropdown = document.getElementById('categoriesDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = categories.map(category => `
        <li><a class="dropdown-item" href="products.html?category=${category.id}">${category.name}</a></li>
    `).join('');
}

function updateCategoriesGrid(categories) {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = categories.slice(0, 6).map(category => `
        <div class="col-md-4 fade-in">
            <div class="category-card" onclick="window.location.href='products.html?category=${category.id}'">
                <img src="${category.image || 'https://via.placeholder.com/300x200'}" 
                     alt="${category.name}" class="w-100 h-100" style="object-fit: cover;">
                <div class="category-content">
                    <h5 class="mb-0">${category.name}</h5>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCategoryFilter(categories) {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    
    const options = categories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
    ).join('');
    filter.innerHTML += options;
}

async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/featured/`);
        const products = await response.json();
        updateProductsGrid(products, 'featuredProducts');
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

async function loadTrendingProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/trending/`);
        const products = await response.json();
        updateProductsGrid(products, 'trendingProducts');
    } catch (error) {
        console.error('Error loading trending products:', error);
    }
}

function updateProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="col-lg-3 col-md-6 fade-in">
            <div class="card product-card h-100" onclick="window.location.href='product-detail.html?id=${product.id}'">
                <div class="product-image">
                    <img src="${product.primary_image || 'https://via.placeholder.com/300x250'}" 
                         alt="${product.name}" loading="lazy">
                    ${product.discount_price ? '<span class="product-badge">Sale</span>' : ''}
                    ${product.is_featured ? '<span class="product-badge" style="right: 12px; left: auto; background: #28a745;">Featured</span>' : ''}
                </div>
                <div class="product-info">
                    <h6 class="product-title">${product.name}</h6>
                    <div class="d-flex align-items-center mb-2">
                        <div class="rating me-2">
                            ${generateStarRating(product.average_rating)}
                        </div>
                        <small class="text-muted">(${product.average_rating || 0})</small>
                    </div>
                    <div class="product-price">
                        ${product.discount_price ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
                        ${formatPrice(product.current_price)}
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">${product.category_name}</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStarRating(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        stars.push('<i class="fas fa-star"></i>');
    }
    
    if (hasHalfStar) {
        stars.push('<i class="fas fa-star-half-alt"></i>');
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
        stars.push('<i class="far fa-star"></i>');
    }
    
    return stars.join('');
}

// Cart Functions
async function updateCartCount() {
    const cartBadge = document.getElementById('cartCount');
    if (!cartBadge) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) {
        cartBadge.textContent = '0';
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/`);
        if (response.ok) {
            const cart = await response.json();
            cartBadge.textContent = cart.total_items || 0;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        cartBadge.textContent = '0';
    }
}

async function addToCart(productVariantId, quantity = 1) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAlert('Please login to add items to cart', 'warning');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        showLoading();
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/add/`, {
            method: 'POST',
            body: JSON.stringify({
                product_variant_id: productVariantId,
                quantity: quantity
            })
        });
        
        if (response.ok) {
            showAlert('Item added to cart successfully!', 'success');
            updateCartCount();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to add item to cart', 'danger');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showAlert('An error occurred while adding to cart', 'danger');
    } finally {
        hideLoading();
    }
}

// URL Parameter Helper
function getUrlParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function updateUrlParameter(param, value) {
    const url = new URL(window.location);
    if (value) {
        url.searchParams.set(param, value);
    } else {
        url.searchParams.delete(param);
    }
    window.history.pushState({}, '', url);
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add fade-in animation to elements as they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all elements with fade-in class
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});