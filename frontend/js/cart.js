// Cart functionality
let cart = null;
let appliedDiscount = null;

async function loadCart() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        showLoading();
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/cart/`);
        
        if (response.ok) {
            cart = await response.json();
            displayCart();
            updateCartSummary();
        } else {
            showAlert('Error loading cart', 'danger');
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showAlert('Error loading cart', 'danger');
    } finally {
        hideLoading();
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
                        <img src="${item.product.primary_image || 'https://via.placeholder.com/100x100'}" 
                             alt="${item.product.name}" class="img-fluid rounded">
                    </div>
                    <div class="col-md-4">
                        <h6 class="mb-1">${item.product.name}</h6>
                        <small class="text-muted">Size: ${item.size} | Color: ${item.color}</small><br>
                        <small class="text-muted">${item.product.category_name}</small>
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
                        <small class="text-muted">${formatPrice(item.product.current_price)} each</small>
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

function updateCartSummary() {
    if (!cart) return;
    
    document.getElementById('subtotal').textContent = formatPrice(cart.total_price);
    document.getElementById('itemCount').textContent = `${cart.total_items} item(s)`;
    
    // Calculate shipping
    const shipping = cart.total_price >= 500 ? 0 : 50;
    document.getElementById('shipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    
    // Calculate tax (18% GST)
    const tax = cart.total_price * 0.18;
    document.getElementById('tax').textContent = formatPrice(tax);
    
    // Apply discount if any
    let discountAmount = 0;
    if (appliedDiscount) {
        discountAmount = appliedDiscount.discount_amount;
        document.getElementById('discount').textContent = `-${formatPrice(discountAmount)}`;
        document.getElementById('discountRow').style.display = 'block';
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }
    
    // Calculate total
    const total = cart.total_price + shipping + tax - discountAmount;
    document.getElementById('total').textContent = formatPrice(total);
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
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showAlert('Error updating quantity', 'danger');
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
            showAlert('Failed to remove item', 'danger');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showAlert('Error removing item', 'danger');
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
            showAlert('Failed to clear cart', 'danger');
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        showAlert('Error clearing cart', 'danger');
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
        showAlert('Error applying discount', 'danger');
    }
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