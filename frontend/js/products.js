// Products page functionality
let currentPage = 1;
let currentFilters = {};
let totalPages = 1;

async function loadProducts(page = 1) {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page: page,
            ...currentFilters
        });
        
        const response = await fetch(`${API_BASE_URL}/products/?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle both paginated and non-paginated responses
        const products = data.results || data;
        const count = data.count || (Array.isArray(data) ? data.length : 0);
        
        displayProducts(products);
        updateResultsCount(count);
        
        // Update pagination only if we have paginated data
        if (data.results) {
            totalPages = Math.ceil(count / (data.results.length || 10));
            updatePagination(data, page);
        }
        
        currentPage = page;
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Error loading products. Please try again.', 'danger');
        
        // Show empty state
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
                    <h4>Error Loading Products</h4>
                    <p class="text-muted">Please check your connection and try again</p>
                    <button class="btn btn-primary" onclick="loadProducts(1)">Retry</button>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">Try adjusting your filters or search terms</p>
                <button class="btn btn-outline-primary" onclick="clearFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card product-card h-100">
                <div class="product-image" onclick="viewProductDetails(${product.id})" style="cursor: pointer;">
                    <img src="${product.primary_image || 'https://via.placeholder.com/300x250'}" 
                         alt="${product.name}" loading="lazy">
                    ${product.discount_price ? '<span class="product-badge">Sale</span>' : ''}
                    ${product.is_featured ? '<span class="product-badge" style="right: 12px; left: auto; background: #28a745;">Featured</span>' : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="flex-grow-1" onclick="viewProductDetails(${product.id})" style="cursor: pointer;">
                        <h6 class="product-title">${product.name}</h6>
                        <div class="d-flex align-items-center mb-2">
                            <div class="rating me-2">
                                ${generateStarRating(product.average_rating || 0)}
                            </div>
                            <small class="text-muted">(${product.average_rating || 0})</small>
                        </div>
                        <div class="product-price">
                            ${product.discount_price ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
                            ${formatPrice(product.current_price)}
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">${product.category_name || 'Fashion'} • ${product.brand || 'Fashion Store'}</small>
                        </div>
                    </div>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="viewProductDetails(${product.id})">
                            <i></i>View Details
                        </button>
                        <button class="btn btn-primary btn-sm flex-fill" onclick="quickAddToCart(${product.id})">
                            <i class="fas fa-cart-plus me-1"></i>Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function viewProductDetails(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count || 0} products found`;
    }
}

function updatePagination(data, currentPage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    if (!data.next && !data.previous) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<ul class="pagination justify-content-center">';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${!data.previous ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${!data.next ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationHTML += '</ul>';
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    loadProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    currentFilters = {};
    currentPage = 1;
    
    // Get filter values
    const search = document.getElementById('searchInput')?.value.trim();
    const category = document.getElementById('categoryFilter')?.value;
    const gender = document.getElementById('genderFilter')?.value;
    const minPrice = document.getElementById('minPrice')?.value;
    const maxPrice = document.getElementById('maxPrice')?.value;
    const brand = document.getElementById('brandFilter')?.value.trim();
    
    // Get selected sizes
    const sizes = Array.from(document.querySelectorAll('input[id^="size"]:checked'))
        .map(input => input.value);
    
    // Build filters object
    if (search) currentFilters.search = search;
    if (category) currentFilters.category = category;
    if (gender) currentFilters.gender = gender;
    if (minPrice) currentFilters.min_price = minPrice;
    if (maxPrice) currentFilters.max_price = maxPrice;
    if (brand) currentFilters.brand = brand;
    if (sizes.length > 0) currentFilters.size = sizes[0];
    
    loadProducts(1);
}

function clearFilters() {
    // Clear all form fields
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const genderFilter = document.getElementById('genderFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const brandFilter = document.getElementById('brandFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (genderFilter) genderFilter.value = '';
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    if (brandFilter) brandFilter.value = '';
    
    // Uncheck all size checkboxes
    document.querySelectorAll('input[id^="size"]').forEach(input => {
        input.checked = false;
    });
    
    currentFilters = {};
    currentPage = 1;
    loadProducts(1);
}

async function quickAddToCart(productId) {
    // Check authentication first
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAlert('Please login to add items to cart', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    try {
        // Get the clicked button and show loading state
        const clickedBtn = event.target.closest('button');
        const originalHTML = clickedBtn.innerHTML;
        clickedBtn.disabled = true;
        clickedBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Adding...';

        // First, fetch product details to get available variants
        const productResponse = await fetch(`${API_BASE_URL}/products/${productId}/`);
        
        if (!productResponse.ok) {
            throw new Error(`Failed to fetch product: ${productResponse.status}`);
        }
        
        const product = await productResponse.json();
        
        if (!product.variants || product.variants.length === 0) {
            throw new Error('Product has no variants available');
        }
        
        // Find first available variant
        const availableVariant = product.variants.find(v => v.is_in_stock && v.stock_quantity > 0);
        
        if (!availableVariant) {
            throw new Error('Product is out of stock');
        }
        
        // Add to cart using authenticated request
        const cartResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/add/`, {
            method: 'POST',
            body: JSON.stringify({
                product_variant_id: availableVariant.id,
                quantity: 1
            })
        });
        
        if (cartResponse.ok) {
            // Success
            showAlert('Item added to cart successfully!', 'success');
            updateCartCount();
            
            // Update button to show success
            clickedBtn.innerHTML = '<i class="fas fa-check me-1"></i>Added!';
            clickedBtn.classList.remove('btn-primary');
            clickedBtn.classList.add('btn-success');
            
            setTimeout(() => {
                clickedBtn.innerHTML = '<i class="fas fa-cart-plus me-1"></i>Add to Cart';
                clickedBtn.classList.remove('btn-success');
                clickedBtn.classList.add('btn-primary');
                clickedBtn.disabled = false;
            }, 2000);
            
        } else {
            // Handle cart API error
            const errorData = await cartResponse.json();
            throw new Error(errorData.error || 'Failed to add to cart');
        }
        
    } catch (error) {
        console.error('Quick add error:', error);
        
        // Show appropriate error message
        let message = 'Error adding product to cart';
        if (error.message.includes('out of stock')) {
            message = 'Product is out of stock';
        } else if (error.message.includes('Insufficient stock')) {
            message = 'Insufficient stock available';
        } else if (error.message.includes('variant')) {
            message = 'Product variant not available';
        } else if (error.message) {
            message = error.message;
        }
        
        showAlert(message, 'danger');
        
        // Reset button
        const clickedBtn = event.target.closest('button');
        if (clickedBtn) {
            clickedBtn.innerHTML = '<i class="fas fa-cart-plus me-1"></i>Add to Cart';
            clickedBtn.disabled = false;
        }
    }
}

// Sort functionality
document.getElementById('sortSelect')?.addEventListener('change', function() {
    currentFilters.ordering = this.value;
    loadProducts(1);
});

// Initialize filters from URL parameters
document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('products.html')) return;
    
    // Set filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('category')) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = urlParams.get('category');
            currentFilters.category = urlParams.get('category');
        }
    }
    
    if (urlParams.get('gender')) {
        const genderFilter = document.getElementById('genderFilter');
        if (genderFilter) {
            genderFilter.value = urlParams.get('gender');
            currentFilters.gender = urlParams.get('gender');
        }
    }
    
    if (urlParams.get('search')) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = urlParams.get('search');
            currentFilters.search = urlParams.get('search');
        }
    }
    
    // Add search input event listener with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 500);
        });
    }
    
    // Initial load
    loadProducts(1);
});