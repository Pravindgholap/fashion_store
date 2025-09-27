// Product detail functionality
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let selectedVariant = null;

async function loadProductDetails() {
    const productId = getUrlParameter('id');
    if (!productId) {
        showAlert('Product not found', 'danger');
        window.location.href = 'products.html';
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/products/${productId}/`);
        
        if (response.ok) {
            currentProduct = await response.json();
            displayProductDetails();
            loadOutfitSuggestions();
        } else {
            showAlert('Product not found', 'danger');
            window.location.href = 'products.html';
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showAlert('Error loading product details', 'danger');
    } finally {
        hideLoading();
    }
}

function displayProductDetails() {
    if (!currentProduct) return;

    // Update breadcrumb
    document.getElementById('productCategory').textContent = currentProduct.category.name;
    
    // Update page title
    document.title = `${currentProduct.name} - Fashion Store`;

    // Create product HTML
    const productContainer = document.getElementById('productContainer');
    productContainer.innerHTML = `
        <div class="col-lg-6">
            <div class="product-images">
                <div class="main-image mb-3">
                    <img src="${currentProduct.images[0]?.image || 'https://via.placeholder.com/500x500'}" 
                         alt="${currentProduct.name}" class="img-fluid rounded" id="mainProductImage">
                </div>
                ${currentProduct.images.length > 1 ? `
                    <div class="thumbnail-images d-flex gap-2 overflow-auto">
                        ${currentProduct.images.map((img, index) => `
                            <img src="${img.image}" alt="${currentProduct.name}" 
                                 class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;"
                                 onclick="changeMainImage('${img.image}')">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
        <div class="col-lg-6">
            <div class="product-details">
                <h1 class="mb-3">${currentProduct.name}</h1>
                <div class="d-flex align-items-center mb-3">
                    <div class="rating me-3">
                        ${generateStarRating(currentProduct.average_rating || 0)}
                    </div>
                    <span class="text-muted">(${currentProduct.reviews?.length || 0} reviews)</span>
                </div>
                
                <div class="price mb-4">
                    ${currentProduct.discount_price ? `
                        <span class="h4 text-primary me-2">${formatPrice(currentProduct.discount_price)}</span>
                        <span class="h6 text-muted text-decoration-line-through">${formatPrice(currentProduct.price)}</span>
                        <span class="badge bg-danger ms-2">${Math.round(((currentProduct.price - currentProduct.discount_price) / currentProduct.price) * 100)}% OFF</span>
                    ` : `
                        <span class="h4 text-primary">${formatPrice(currentProduct.price)}</span>
                    `}
                </div>

                <div class="product-info mb-4">
                    <p><strong>Brand:</strong> ${currentProduct.brand || 'Fashion Store'}</p>
                    <p><strong>Category:</strong> ${currentProduct.category.name}</p>
                    <p><strong>Gender:</strong> ${currentProduct.gender.charAt(0).toUpperCase() + currentProduct.gender.slice(1)}</p>
                    ${currentProduct.material ? `<p><strong>Material:</strong> ${currentProduct.material}</p>` : ''}
                </div>

                ${currentProduct.variants && currentProduct.variants.length > 0 ? `
                    <!-- Size Selection -->
                    <div class="mb-3">
                        <label class="form-label"><strong>Size:</strong></label>
                        <div class="size-options d-flex gap-2 flex-wrap">
                            ${[...new Set(currentProduct.variants.map(v => v.size))].map(size => `
                                <button class="btn btn-outline-secondary size-btn" 
                                        onclick="selectSize('${size}')" data-size="${size}">
                                    ${size}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Color Selection -->
                    <div class="mb-4">
                        <label class="form-label"><strong>Color:</strong></label>
                        <div class="color-options d-flex gap-2 flex-wrap">
                            ${[...new Set(currentProduct.variants.map(v => v.color))].map(color => `
                                <button class="btn btn-outline-secondary color-btn" 
                                        onclick="selectColor('${color}')" data-color="${color}">
                                    ${color}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Quantity and Add to Cart -->
                <div class="mb-4">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <label class="form-label"><strong>Quantity:</strong></label>
                            <div class="quantity-controls d-flex align-items-center">
                                <button class="btn btn-outline-secondary" onclick="changeQuantity(-1)">-</button>
                                <input type="number" class="form-control mx-2 text-center" value="1" min="1" id="quantityInput" style="width: 80px;">
                                <button class="btn btn-outline-secondary" onclick="changeQuantity(1)">+</button>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <button class="btn btn-primary btn-lg w-100" onclick="addProductToCart()" id="addToCartBtn">
                                <i class="fas fa-shopping-cart me-2"></i>Add to Cart
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stock Status -->
                <div class="stock-status mb-3" id="stockStatus">
                    <span class="text-success">
                        <i class="fas fa-check-circle me-2"></i>In Stock
                    </span>
                </div>

                <!-- Action Buttons -->
                <div class="product-actions d-flex gap-2 mb-4">
                    <button class="btn btn-outline-danger">
                        <i class="fas fa-heart me-2"></i>Add to Wishlist
                    </button>
                    <button class="btn btn-outline-info">
                        <i class="fas fa-share me-2"></i>Share
                    </button>
                </div>
            </div>
        </div>
    `;

    // Load tab content
    loadProductTabs();
    
    // Select first available variant if any
    if (currentProduct.variants && currentProduct.variants.length > 0) {
        const firstVariant = currentProduct.variants[0];
        selectSize(firstVariant.size);
        selectColor(firstVariant.color);
    }
}

function changeMainImage(imageUrl) {
    document.getElementById('mainProductImage').src = imageUrl;
}

function selectSize(size) {
    selectedSize = size;
    
    // Update UI
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-secondary');
    });
    document.querySelector(`[data-size="${size}"]`).classList.remove('btn-outline-secondary');
    document.querySelector(`[data-size="${size}"]`).classList.add('btn-primary');
    
    updateSelectedVariant();
}

function selectColor(color) {
    selectedColor = color;
    
    // Update UI
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-secondary');
    });
    document.querySelector(`[data-color="${color}"]`).classList.remove('btn-outline-secondary');
    document.querySelector(`[data-color="${color}"]`).classList.add('btn-primary');
    
    updateSelectedVariant();
}

function updateSelectedVariant() {
    if (!selectedSize || !selectedColor) return;
    
    selectedVariant = currentProduct.variants.find(v => 
        v.size === selectedSize && v.color === selectedColor
    );
    
    // Update stock status
    const stockStatus = document.getElementById('stockStatus');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    if (selectedVariant && selectedVariant.is_in_stock) {
        stockStatus.innerHTML = `
            <span class="text-success">
                <i class="fas fa-check-circle me-2"></i>In Stock (${selectedVariant.stock_quantity} available)
            </span>
        `;
        addToCartBtn.disabled = false;
    } else {
        stockStatus.innerHTML = `
            <span class="text-danger">
                <i class="fas fa-times-circle me-2"></i>Out of Stock
            </span>
        `;
        addToCartBtn.disabled = true;
    }
}

function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantityInput');
    let newQuantity = parseInt(quantityInput.value) + delta;
    
    if (newQuantity < 1) newQuantity = 1;
    if (selectedVariant && newQuantity > selectedVariant.stock_quantity) {
        newQuantity = selectedVariant.stock_quantity;
        showAlert(`Only ${selectedVariant.stock_quantity} items available`, 'warning');
    }
    
    quantityInput.value = newQuantity;
}

async function addProductToCart() {
    if (!selectedVariant) {
        showAlert('Please select size and color', 'warning');
        return;
    }
    
    const quantity = parseInt(document.getElementById('quantityInput').value);
    await addToCart(selectedVariant.id, quantity);
}

function loadProductTabs() {
    // Description Tab
    document.getElementById('productDescription').innerHTML = `
        <div class="product-description">
            <p>${currentProduct.description}</p>
        </div>
    `;
    
    // Specifications Tab
    document.getElementById('productSpecs').innerHTML = `
        <table class="table table-striped">
            <tr><td><strong>Brand</strong></td><td>${currentProduct.brand || 'Fashion Store'}</td></tr>
            <tr><td><strong>Category</strong></td><td>${currentProduct.category.name}</td></tr>
            <tr><td><strong>Gender</strong></td><td>${currentProduct.gender.charAt(0).toUpperCase() + currentProduct.gender.slice(1)}</td></tr>
            ${currentProduct.material ? `<tr><td><strong>Material</strong></td><td>${currentProduct.material}</td></tr>` : ''}
            <tr><td><strong>Available Sizes</strong></td><td>${[...new Set(currentProduct.variants?.map(v => v.size) || [])].join(', ')}</td></tr>
            <tr><td><strong>Available Colors</strong></td><td>${[...new Set(currentProduct.variants?.map(v => v.color) || [])].join(', ')}</td></tr>
        </table>
    `;
    
    // Reviews Tab
    loadReviews();
}

function loadReviews() {
    const reviewsContainer = document.getElementById('productReviews');
    
    if (!currentProduct.reviews || currentProduct.reviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">No reviews yet. Be the first to review this product!</p>
                <button class="btn btn-primary" onclick="openReviewModal()">Write a Review</button>
            </div>
        `;
        return;
    }
    
    reviewsContainer.innerHTML = `
        <div class="reviews-summary mb-4">
            <div class="row">
                <div class="col-md-6">
                    <div class="average-rating">
                        <span class="h2">${currentProduct.average_rating || 0}</span>
                        <div class="rating">${generateStarRating(currentProduct.average_rating || 0)}</div>
                        <small class="text-muted">${currentProduct.reviews.length} review(s)</small>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <button class="btn btn-primary" onclick="openReviewModal()">Write a Review</button>
                </div>
            </div>
        </div>
        
        <div class="reviews-list">
            ${currentProduct.reviews.map(review => `
                <div class="review-item border-bottom py-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${review.user_name || 'Anonymous'}</strong>
                            <div class="rating">${generateStarRating(review.rating)}</div>
                        </div>
                        <small class="text-muted">${formatDate(review.created_at)}</small>
                    </div>
                    <p class="mb-0">${review.comment}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function openReviewModal() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAlert('Please login to write a review', 'warning');
        window.location.href = 'login.html';
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
}

async function loadOutfitSuggestions() {
    if (!currentProduct) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/${currentProduct.id}/outfit-suggestions/`);
        const suggestions = await response.json();
        
        const container = document.getElementById('outfitSuggestions');
        if (suggestions.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No suggestions available</p>';
            return;
        }
        
        container.innerHTML = suggestions.map(product => `
            <div class="col-lg-3 col-md-6">
                <div class="card product-card h-100" onclick="window.location.href='product-detail.html?id=${product.id}'">
                    <div class="product-image">
                        <img src="${product.primary_image || 'https://via.placeholder.com/300x250'}" 
                             alt="${product.name}" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h6 class="product-title">${product.name}</h6>
                        <div class="product-price">
                            ${formatPrice(product.current_price)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading outfit suggestions:', error);
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Review form handler
document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const rating = formData.get('rating');
    const comment = document.getElementById('reviewComment').value;
    
    if (!rating) {
        showAlert('Please select a rating', 'warning');
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/products/${currentProduct.id}/reviews/`, {
            method: 'POST',
            body: JSON.stringify({
                rating: parseInt(rating),
                comment: comment
            })
        });
        
        if (response.ok) {
            showAlert('Review added successfully!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            modal.hide();
            
            // Reload product to show new review
            setTimeout(() => {
                loadProductDetails();
            }, 1000);
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to add review', 'danger');
        }
    } catch (error) {
        console.error('Error adding review:', error);
        showAlert('Error adding review', 'danger');
    }
});

// Rating input functionality
document.addEventListener('DOMContentLoaded', function() {
    const ratingInputs = document.querySelectorAll('.rating-input input[type="radio"]');
    ratingInputs.forEach(input => {
        input.addEventListener('change', function() {
            const labels = document.querySelectorAll('.rating-input label');
            labels.forEach(label => label.style.color = '#ddd');
            
            const rating = parseInt(this.value);
            for (let i = 0; i < rating; i++) {
                labels[4 - i].style.color = '#ffc107';
            }
        });
    });
});