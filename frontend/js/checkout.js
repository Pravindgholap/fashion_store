// // Checkout functionality
// let checkoutData = null;
// let orderTotal = 0;

// function loadCheckoutData() {
//     const data = sessionStorage.getItem('checkoutData');
//     if (!data) {
//         showAlert('No checkout data found', 'warning');
//         window.location.href = 'cart.html';
//         return;
//     }
    
//     checkoutData = JSON.parse(data);
//     displayOrderSummary();
//     prefillUserData();
// }

// function displayOrderSummary() {
//     if (!checkoutData || !checkoutData.cart) return;
    
//     const cart = checkoutData.cart;
    
//     // Display order items
//     const itemsContainer = document.getElementById('orderItems');
//     itemsContainer.innerHTML = cart.items.map(item => `
//         <div class="d-flex align-items-center mb-3">
//             <img src="${item.product.primary_image || 'https://via.placeholder.com/60x60'}" 
//                  alt="${item.product.name}" class="me-3" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
//             <div class="flex-grow-1">
//                 <h6 class="mb-1">${item.product.name}</h6>
//                 <small class="text-muted">Size: ${item.size} | Color: ${item.color}</small><br>
//                 <small class="text-muted">Qty: ${item.quantity}</small>
//             </div>
//             <div class="text-end">
//                 <strong>${formatPrice(item.subtotal)}</strong>
//             </div>
//         </div>
//     `).join('');
    
//     // Calculate totals
//     const subtotal = cart.total_price;
//     const shipping = subtotal >= 500 ? 0 : 50;
//     const tax = subtotal * 0.18;
//     const discount = checkoutData.discount ? checkoutData.discount.discount_amount : 0;
//     orderTotal = subtotal + shipping + tax - discount;
    
//     // Update summary
//     document.getElementById('orderSubtotal').textContent = formatPrice(subtotal);
//     document.getElementById('orderShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
//     document.getElementById('orderTax').textContent = formatPrice(tax);
    
//     if (discount > 0) {
//         document.getElementById('orderDiscountRow').style.display = 'block';
//         document.getElementById('orderDiscount').textContent = `-${formatPrice(discount)}`;
//     }
    
//     document.getElementById('orderTotal').textContent = formatPrice(orderTotal);
// }

// function prefillUserData() {
//     const user = JSON.parse(localStorage.getItem('user') || '{}');
    
//     if (user.first_name && user.last_name) {
//         document.getElementById('shippingName').value = `${user.first_name} ${user.last_name}`;
//     }
//     if (user.email) {
//         document.getElementById('shippingEmail').value = user.email;
//     }
//     if (user.phone) {
//         document.getElementById('shippingPhone').value = user.phone;
//     }
// }

// function setupPaymentMethodToggle() {
//     const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
//     const cardForm = document.getElementById('cardPaymentForm');
//     const upiForm = document.getElementById('upiPaymentForm');
    
//     paymentMethods.forEach(method => {
//         method.addEventListener('change', function() {
//             cardForm.style.display = 'none';
//             upiForm.style.display = 'none';
            
//             if (this.value === 'card') {
//                 cardForm.style.display = 'block';
//             } else if (this.value === 'upi') {
//                 upiForm.style.display = 'block';
//             }
//         });
//     });
// }

// async function placeOrder() {
//     // Validate form
//     const form = document.getElementById('shippingForm');
//     if (!form.checkValidity()) {
//         form.reportValidity();
//         return;
//     }
    
//     const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
//     const orderData = {
//         shipping_name: document.getElementById('shippingName').value,
//         shipping_email: document.getElementById('shippingEmail').value,
//         shipping_phone: document.getElementById('shippingPhone').value,
//         shipping_address_line1: document.getElementById('shippingAddress1').value,
//         shipping_address_line2: document.getElementById('shippingAddress2').value,
//         shipping_city: document.getElementById('shippingCity').value,
//         shipping_state: document.getElementById('shippingState').value,
//         shipping_postal_code: document.getElementById('shippingPostalCode').value,
//         payment_method: paymentMethod
//     };
    
//     // Add discount code if applied
//     if (checkoutData.discount) {
//         orderData.discount_code = checkoutData.discount.discount_code;
//     }
    
//     try {
//         showLoading();
//         const response = await makeAuthenticatedRequest(`${API_BASE_URL}/orders/create/`, {
//             method: 'POST',
//             body: JSON.stringify(orderData)
//         });
        
//         if (response.ok) {
//             const order = await response.json();
            
//             // Clear checkout data
//             sessionStorage.removeItem('checkoutData');
            
//             // Show success and redirect
//             showAlert('Order placed successfully!', 'success');
//             setTimeout(() => {
//                 window.location.href = `orders.html`;
//             }, 2000);
//         } else {
//             const error = await response.json();
//             showAlert(error.error || 'Failed to place order', 'danger');
//         }
//     } catch (error) {
//         console.error('Error placing order:', error);
//         showAlert('Error placing order', 'danger');
//     } finally {
//         hideLoading();
//     }
// }

let checkoutData = null;
let orderTotal = 0;
let savedAddresses = [];
let selectedAddressId = null;

async function loadSavedAddresses() {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/addresses/`);
        if (response.ok) {
            savedAddresses = await response.json();
            displaySavedAddresses();
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
    }
}

function displaySavedAddresses() {
    const container = document.getElementById('savedAddressesContainer');
    if (!container) return;
    
    if (savedAddresses.length === 0) {
        container.innerHTML = '<p class="text-muted">No saved addresses. Fill in the form below to add a new address.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Select a saved address:</label>
            <div class="row g-3">
                ${savedAddresses.map(address => `
                    <div class="col-md-6">
                        <div class="card address-card ${address.is_default ? 'border-primary' : ''}" 
                             onclick="selectAddress(${address.id})" 
                             style="cursor: pointer;">
                            <div class="card-body">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="savedAddress" 
                                           id="address${address.id}" value="${address.id}"
                                           ${address.is_default ? 'checked' : ''}>
                                    <label class="form-check-label" for="address${address.id}">
                                        <strong>${address.label}</strong>
                                        ${address.is_default ? '<span class="badge bg-primary ms-2">Default</span>' : ''}
                                    </label>
                                </div>
                                <div class="mt-2">
                                    <p class="mb-1"><strong>${address.full_name}</strong></p>
                                    <p class="mb-1 small text-muted">
                                        ${address.address_line1}<br>
                                        ${address.address_line2 ? address.address_line2 + '<br>' : ''}
                                        ${address.city}, ${address.state} ${address.postal_code}<br>
                                        ${address.country}
                                    </p>
                                    <p class="mb-0 small text-muted">Phone: ${address.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="form-check mb-3">
            <input class="form-check-input" type="radio" name="savedAddress" id="newAddress" value="new">
            <label class="form-check-label" for="newAddress">
                <strong>Use a different address</strong>
            </label>
        </div>
    `;
    
    // Set default address as selected
    const defaultAddress = savedAddresses.find(addr => addr.is_default);
    if (defaultAddress) {
        selectAddress(defaultAddress.id);
    }
    
    // Add event listeners for radio buttons
    document.querySelectorAll('input[name="savedAddress"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'new') {
                selectedAddressId = null;
                showManualAddressForm();
            } else {
                selectAddress(parseInt(this.value));
            }
        });
    });
}

function selectAddress(addressId) {
    selectedAddressId = addressId;
    const address = savedAddresses.find(addr => addr.id === addressId);
    
    if (address) {
        // Hide manual form
        document.getElementById('shippingForm').style.display = 'none';
        document.getElementById('saveAddressCheckbox').style.display = 'none';
        
        // Update radio selection
        const radio = document.getElementById(`address${addressId}`);
        if (radio) radio.checked = true;
        
        // Highlight selected card
        document.querySelectorAll('.address-card').forEach(card => {
            card.classList.remove('border-primary', 'bg-light');
        });
        const selectedCard = document.getElementById(`address${addressId}`)?.closest('.address-card');
        if (selectedCard) {
            selectedCard.classList.add('border-primary', 'bg-light');
        }
    }
}

function showManualAddressForm() {
    document.getElementById('shippingForm').style.display = 'block';
    document.getElementById('saveAddressCheckbox').style.display = 'block';
    
    // Clear radio selections
    document.querySelectorAll('.address-card').forEach(card => {
        card.classList.remove('border-primary', 'bg-light');
    });
}

function loadCheckoutData() {
    const data = sessionStorage.getItem('checkoutData');
    if (!data) {
        showAlert('No checkout data found', 'warning');
        window.location.href = 'cart.html';
        return;
    }
    
    checkoutData = JSON.parse(data);
    displayOrderSummary();
    loadSavedAddresses();
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
    
    if (user.email) {
        document.getElementById('shippingEmail').value = user.email;
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
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    let orderData = {
        payment_method: paymentMethod
    };
    
    // Check if using saved address or manual entry
    if (selectedAddressId) {
        orderData.use_saved_address = true;
        orderData.saved_address_id = selectedAddressId;
    } else {
        // Validate manual form
        const form = document.getElementById('shippingForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        orderData = {
            ...orderData,
            use_saved_address: false,
            shipping_name: document.getElementById('shippingName').value,
            shipping_email: document.getElementById('shippingEmail').value,
            shipping_phone: document.getElementById('shippingPhone').value,
            shipping_address_line1: document.getElementById('shippingAddress1').value,
            shipping_address_line2: document.getElementById('shippingAddress2').value,
            shipping_city: document.getElementById('shippingCity').value,
            shipping_state: document.getElementById('shippingState').value,
            shipping_postal_code: document.getElementById('shippingPostalCode').value
        };
        
        // Check if user wants to save this address
        const saveAddress = document.getElementById('saveAddress')?.checked;
        if (saveAddress) {
            await saveNewAddress(orderData);
        }
    }
    
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

async function saveNewAddress(addressData) {
    const addressLabel = prompt('Enter a label for this address (e.g., Home, Office):');
    if (!addressLabel) return;
    
    const newAddress = {
        label: addressLabel,
        full_name: addressData.shipping_name,
        phone: addressData.shipping_phone,
        address_line1: addressData.shipping_address_line1,
        address_line2: addressData.shipping_address_line2,
        city: addressData.shipping_city,
        state: addressData.shipping_state,
        postal_code: addressData.shipping_postal_code,
        country: 'India',
        is_default: savedAddresses.length === 0
    };
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/addresses/`, {
            method: 'POST',
            body: JSON.stringify(newAddress)
        });
        
        if (response.ok) {
            showAlert('Address saved successfully!', 'success');
        }
    } catch (error) {
        console.error('Error saving address:', error);
    }
}