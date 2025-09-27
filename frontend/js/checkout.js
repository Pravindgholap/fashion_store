// Checkout functionality
let checkoutData = null;
let orderTotal = 0;

function loadCheckoutData() {
    const data = sessionStorage.getItem('checkoutData');
    if (!data) {
        showAlert('No checkout data found', 'warning');
        window.location.href = 'cart.html';
        return;
    }
    
    checkoutData = JSON.parse(data);
    displayOrderSummary();
    prefillUserData();
}

function displayOrderSummary() {
    if (!checkoutData || !checkoutData.cart) return;
    
    const cart = checkoutData.cart;
    
    // Display order items
    const itemsContainer = document.getElementById('orderItems');
    itemsContainer.innerHTML = cart.items.map(item => `
        <div class="d-flex align-items-center mb-3">
            <img src="${item.product.primary_image || 'https://via.placeholder.com/60x60'}" 
                 alt="${item.product.name}" class="me-3" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div class="flex-grow-1">
                <h6 class="mb-1">${item.product.name}</h6>
                <small class="text-muted">Size: ${item.size} | Color: ${item.color}</small><br>
                <small class="text-muted">Qty: ${item.quantity}</small>
            </div>
            <div class="text-end">
                <strong>${formatPrice(item.subtotal)}</strong>
            </div>
        </div>
    `).join('');
    
    // Calculate totals
    const subtotal = cart.total_price;
    const shipping = subtotal >= 500 ? 0 : 50;
    const tax = subtotal * 0.18;
    const discount = checkoutData.discount ? checkoutData.discount.discount_amount : 0;
    orderTotal = subtotal + shipping + tax - discount;
    
    // Update summary
    document.getElementById('orderSubtotal').textContent = formatPrice(subtotal);
    document.getElementById('orderShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    document.getElementById('orderTax').textContent = formatPrice(tax);
    
    if (discount > 0) {
        document.getElementById('orderDiscountRow').style.display = 'block';
        document.getElementById('orderDiscount').textContent = `-${formatPrice(discount)}`;
    }
    
    document.getElementById('orderTotal').textContent = formatPrice(orderTotal);
}

function prefillUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.first_name && user.last_name) {
        document.getElementById('shippingName').value = `${user.first_name} ${user.last_name}`;
    }
    if (user.email) {
        document.getElementById('shippingEmail').value = user.email;
    }
    if (user.phone) {
        document.getElementById('shippingPhone').value = user.phone;
    }
}

function setupPaymentMethodToggle() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const cardForm = document.getElementById('cardPaymentForm');
    const upiForm = document.getElementById('upiPaymentForm');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            cardForm.style.display = 'none';
            upiForm.style.display = 'none';
            
            if (this.value === 'card') {
                cardForm.style.display = 'block';
            } else if (this.value === 'upi') {
                upiForm.style.display = 'block';
            }
        });
    });
}

async function placeOrder() {
    // Validate form
    const form = document.getElementById('shippingForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    const orderData = {
        shipping_name: document.getElementById('shippingName').value,
        shipping_email: document.getElementById('shippingEmail').value,
        shipping_phone: document.getElementById('shippingPhone').value,
        shipping_address_line1: document.getElementById('shippingAddress1').value,
        shipping_address_line2: document.getElementById('shippingAddress2').value,
        shipping_city: document.getElementById('shippingCity').value,
        shipping_state: document.getElementById('shippingState').value,
        shipping_postal_code: document.getElementById('shippingPostalCode').value,
        payment_method: paymentMethod
    };
    
    // Add discount code if applied
    if (checkoutData.discount) {
        orderData.discount_code = checkoutData.discount.discount_code;
    }
    
    try {
        showLoading();
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/orders/create/`, {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const order = await response.json();
            
            // Clear checkout data
            sessionStorage.removeItem('checkoutData');
            
            // Show success and redirect
            showAlert('Order placed successfully!', 'success');
            setTimeout(() => {
                window.location.href = `orders.html`;
            }, 2000);
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to place order', 'danger');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showAlert('Error placing order', 'danger');
    } finally {
        hideLoading();
    }
}