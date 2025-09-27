// Products page functionality
let currentPage = 1;
let currentFilters = {};

async function loadProducts(page = 1) {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page: page,
            ...currentFilters
        });
        
        const response = await fetch(`${API_BASE_URL}/products/?${params}`);
        const data = await response.json();
        
        displayProducts(data.results || data);
        updateResultsCount(data.count || data.length);
        updatePagination(data, page);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Error loading products', 'danger');
    } finally {
        hideLoading();
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="col-lg-4 col-md-6 mb-4">
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
                            ${generateStarRating(product.average_rating || 0)}
                        </div>
                        <small class="text-muted">(${product.average_rating || 0})</small>
                    </div>
                    <div class="product-price">
                        ${product.discount_price ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
                        ${formatPrice(product.current_price)}
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">${product.category_name} • ${product.brand || 'Fashion Store'}</small>
                    </div>
                    <button class="btn btn-primary btn-sm mt-2 w-100" onclick="event.stopPropagation(); quickAddToCart(${product.id})">
                        <i class="fas fa-shopping-cart me-2"></i>Quick Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count || 0} products found`;
    }
}

function updatePagination(data, currentPage) {
    const pagination = document.getElementById('pagination');
    if (!pagination || !data.next && !data.previous) {
        pagination.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(data.count / 12); // Assuming 12 items per page
    let paginationHTML = '<ul class="pagination justify-content-center">';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${!data.previous ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers (simple version)
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
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
    currentPage = page;
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
    if (sizes.length > 0) currentFilters.size = sizes[0]; // API might need modification for multiple sizes
    
    loadProducts(1);
}

function clearFilters() {
    // Clear all form fields
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('genderFilter').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('brandFilter').value = '';
    
    // Uncheck all size checkboxes
    document.querySelectorAll('input[id^="size"]').forEach(input => {
        input.checked = false;
    });
    
    currentFilters = {};
    currentPage = 1;
    loadProducts(1);
}

async function quickAddToCart(productId) {
    try {
        // First, get product variants
        const response = await fetch(`${API_BASE_URL}/products/${productId}/`);
        const product = await response.json();
        
        if (product.variants && product.variants.length > 0) {
            // Use first available variant
            const availableVariant = product.variants.find(v => v.is_in_stock);
            if (availableVariant) {
                await addToCart(availableVariant.id, 1);
            } else {
                showAlert('Product is out of stock', 'warning');
            }
        } else {
            showAlert('Product variants not available', 'warning');
        }
    } catch (error) {
        console.error('Error in quick add to cart:', error);
        showAlert('Error adding product to cart', 'danger');
    }
}

// Sort functionality
document.getElementById('sortSelect')?.addEventListener('change', function() {
    currentFilters.ordering = this.value;
    loadProducts(1);
});

// Initialize filters from URL parameters
document.addEventListener('DOMContentLoaded', function() {
    // Set filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('category')) {
        document.getElementById('categoryFilter').value = urlParams.get('category');
        currentFilters.category = urlParams.get('category');
    }
    
    if (urlParams.get('gender')) {
        document.getElementById('genderFilter').value = urlParams.get('gender');
        currentFilters.gender = urlParams.get('gender');
    }
    
    if (urlParams.get('search')) {
        document.getElementById('searchInput').value = urlParams.get('search');
        currentFilters.search = urlParams.get('search');
    }
    
    // Add search input event listener
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
});