let cart = null;
let appliedDiscount = null;

async function loadCart() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAlert('Please login to view your cart', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    try {
        showLoading();
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/`);
        
        if (response.ok) {
            cart = await response.json();
            displayCart();
            updateCartSummary();
        } else if (response.status === 401) {
            // Handle authentication error (already handled in makeAuthenticatedRequest)
            return;
        } else if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('login again')) {
                showAlert('Please logout and login again to access your cart', 'warning');
                setTimeout(() => {
                    logout();
                }, 2000);
            } else {
                showAlert('Error loading cart: ' + (errorData.error || 'Unknown error'), 'danger');
            }
        } else {
            showAlert('Error loading cart', 'danger');
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        
        if (error.message.includes('Authentication failed') || error.message.includes('User validation failed')) {
            // Error already handled in makeAuthenticatedRequest
            return;
        }
        
        showAlert('Error loading cart. Please try again.', 'danger');
        
        // Show empty cart state on error
        displayEmptyCart();
    } finally {
        hideLoading();
    }
}

function displayEmptyCart() {
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
                <h4>Unable to load cart</h4>
                <p class="text-muted">Please try refreshing the page</p>
                <button class="btn btn-primary" onclick="loadCart()">Retry</button>
            </div>
        `;
    }
}

function displayCart() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    if (!cart || cart.items.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
                <h4>Your cart is empty</h4>
                <p class="text-muted">Add some products to get started</p>
                <a href="products.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        return;
    }
    
    cartItems.innerHTML = cart.items.map(item => `
        <div class="card cart-item">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${item.product_image || 'https://via.placeholder.com/100x100'}" 
                             alt="${item.product_name}" class="img-fluid rounded">
                    </div>
                    <div class="col-md-4">
                        <h6 class="mb-1">${item.product_name}</h6>
                        <small class="text-muted">Size: ${item.size} | Color: ${item.color}</small>
                    </div>
                    <div class="col-md-2">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" 
                                   onchange="updateQuantity(${item.id}, this.value)" min="1">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2 text-center">
                        <strong>${formatPrice(item.subtotal)}</strong><br>
                        <small class="text-muted">${formatPrice(item.product_price)} each</small>
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-outline-danger btn-sm" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/items/${itemId}/update/`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: parseInt(newQuantity) })
        });
        
        if (response.ok) {
            cart = await response.json();
            displayCart();
            updateCartSummary();
            updateCartCount();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to update quantity', 'danger');
            
            // Revert the input value on error
            const input = document.querySelector(`input[onchange*="${itemId}"]`);
            if (input && cart) {
                const currentItem = cart.items.find(item => item.id === itemId);
                if (currentItem) {
                    input.value = currentItem.quantity;
                }
            }
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        if (!error.message.includes('Authentication failed')) {
            showAlert('Error updating quantity', 'danger');
        }
    }
}

async function removeFromCart(itemId) {
    if (!confirm('Are you sure you want to remove this item?')) return;
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/items/${itemId}/remove/`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            cart = await response.json();
            displayCart();
            updateCartSummary();
            updateCartCount();
            showAlert('Item removed from cart', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to remove item', 'danger');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        if (!error.message.includes('Authentication failed')) {
            showAlert('Error removing item', 'danger');
        }
    }
}

async function clearCart() {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/clear/`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            cart = await response.json();
            displayCart();
            updateCartSummary();
            updateCartCount();
            showAlert('Cart cleared successfully', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to clear cart', 'danger');
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        if (!error.message.includes('Authentication failed')) {
            showAlert('Error clearing cart', 'danger');
        }
    }
}

async function applyDiscount() {
    const discountCode = document.getElementById('discountCode').value.trim();
    if (!discountCode) {
        showAlert('Please enter a discount code', 'warning');
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/apply-discount/`, {
            method: 'POST',
            body: JSON.stringify({ discount_code: discountCode })
        });
        
        if (response.ok) {
            appliedDiscount = await response.json();
            updateCartSummary();
            showAlert('Discount applied successfully!', 'success');
            document.getElementById('discountCode').value = '';
        } else {
            const error = await response.json();
            showAlert(error.error || 'Invalid discount code', 'danger');
        }
    } catch (error) {
        console.error('Error applying discount:', error);
        if (!error.message.includes('Authentication failed')) {
            showAlert('Error applying discount', 'danger');
        }
    }
}

function updateCartSummary() {
    if (!cart) return;
    
    const subtotalElement = document.getElementById('subtotal');
    const itemCountElement = document.getElementById('itemCount');
    const shippingElement = document.getElementById('shipping');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    
    if (subtotalElement) subtotalElement.textContent = formatPrice(cart.total_price);
    if (itemCountElement) itemCountElement.textContent = `${cart.total_items} item(s)`;
    
    // Calculate shipping
    const shipping = cart.total_price >= 500 ? 0 : 50;
    if (shippingElement) shippingElement.textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    
    // Calculate tax (18% GST)
    const tax = cart.total_price * 0.18;
    if (taxElement) taxElement.textContent = formatPrice(tax);
    
    // Apply discount if any
    let discountAmount = 0;
    const discountElement = document.getElementById('discount');
    const discountRow = document.getElementById('discountRow');
    
    if (appliedDiscount) {
        discountAmount = appliedDiscount.discount_amount;
        if (discountElement) discountElement.textContent = `-${formatPrice(discountAmount)}`;
        if (discountRow) discountRow.style.display = 'block';
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }
    
    // Calculate total
    const total = cart.total_price + shipping + tax - discountAmount;
    if (totalElement) totalElement.textContent = formatPrice(total);
}

function proceedToCheckout() {
    if (!cart || cart.items.length === 0) {
        showAlert('Your cart is empty', 'warning');
        return;
    }
    
    // Store checkout data
    const checkoutData = {
        cart: cart,
        discount: appliedDiscount
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    window.location.href = 'checkout.html';
}

// Enhanced addToCart function for use across the site
async function addToCart(variantId, quantity = 1) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAlert('Please login to add items to cart', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return false;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/add/`, {
            method: 'POST',
            body: JSON.stringify({
                product_variant_id: variantId,
                quantity: quantity
            })
        });
        
        if (response.ok) {
            showAlert('Item added to cart successfully!', 'success');
            updateCartCount();
            return true;
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to add item to cart', 'danger');
            return false;
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        if (!error.message.includes('Authentication failed')) {
            showAlert('Error adding item to cart', 'danger');
        }
        return false;
    }
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('cart.html')) {
        loadCart();
    }
});