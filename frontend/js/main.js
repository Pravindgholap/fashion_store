const API_BASE_URL = 'http://localhost:8000/api';

// Utility Functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('d-none');
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('d-none');
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

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            const newHeaders = { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options.headers };
            return fetch(url, { ...options, headers: newHeaders });
        } else {
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

// Category Functions
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/categories/`);
        if (response.ok) {
            const categories = await response.json();
            updateCategoriesDropdown(categories);
            updateCategoriesGrid(categories);
            updateCategoryFilter(categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function updateCategoriesDropdown(categories) {
    const dropdown = document.getElementById('categoriesDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = categories.map(category => `
        <li><a class="dropdown-item text-uppercase" style="font-size: 12px; letter-spacing: 0.5px;" href="products.html?category=${category.id}">${category.name}</a></li>
    `).join('');
}

function updateCategoriesGrid(categories) {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = categories.slice(0, 6).map(category => {
        const imageUrl = category.image ? `http://localhost:8000${category.image}` : 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500';
        
        return `
            <div class="col-md-4 col-6">
                <div class="category-card" onclick="window.location.href='products.html?category=${category.id}'" style="height: 400px; cursor: pointer; position: relative; overflow: hidden;">
                    <img src="${imageUrl}" alt="${category.name}" class="w-100 h-100" style="object-fit: cover; transition: transform 0.6s;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 30px; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white;">
                        <h5 class="fw-bold text-uppercase mb-0" style="letter-spacing: 1px;">${category.name}</h5>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateCategoryFilter(categories) {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;
    
    const options = categories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
    ).join('');
    
    filter.innerHTML = '<option value="">All Categories</option>' + options;
}

// Product Functions
async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/featured/`);
        if (response.ok) {
            const products = await response.json();
            updateProductsGrid(products, 'featuredProducts');
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

async function loadTrendingProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/trending/`);
        if (response.ok) {
            const products = await response.json();
            updateProductsGrid(products, 'trendingProducts');
        }
    } catch (error) {
        console.error('Error loading trending products:', error);
    }
}

function updateProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No products available</p></div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const imageUrl = product.primary_image || 'https://via.placeholder.com/400x500';
        
        return `
            <div class="col-lg-3 col-md-6 col-6">
                <div class="product-card h-100" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">
                    <div class="product-image" style="position: relative; overflow: hidden; background: #F5F5F5; height: 400px;">
                        <img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s;">
                        ${product.discount_price ? '<span class="product-badge" style="position: absolute; top: 16px; left: 16px; background: #000; color: white; padding: 6px 14px; font-size: 10px; font-weight: 700; letter-spacing: 1px;">SALE</span>' : ''}
                    </div>
                    <div class="product-info" style="padding: 16px 0; text-align: left;">
                        <h6 class="product-title mb-2" style="font-size: 14px; font-weight: 600; letter-spacing: 0.3px; min-height: 40px;">${product.name}</h6>
                        <div class="product-price" style="font-weight: 600; font-size: 15px;">
                            ${product.discount_price ? `<span class="text-muted text-decoration-line-through me-2" style="font-size: 13px;">${formatPrice(product.price)}</span>` : ''}
                            ${formatPrice(product.current_price)}
                        </div>
                        ${product.brand ? `<div class="mt-1"><small class="text-muted text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">${product.brand}</small></div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
        } else {
            cartBadge.textContent = '0';
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
            showAlert('Item added to cart!', 'success');
            updateCartCount();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to add item to cart', 'danger');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showAlert('An error occurred', 'danger');
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Add hover effect to product cards
    document.addEventListener('mouseover', function(e) {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const img = productCard.querySelector('.product-image img');
            if (img) img.style.transform = 'scale(1.05)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const img = productCard.querySelector('.product-image img');
            if (img) img.style.transform = 'scale(1)';
        }
    });
});