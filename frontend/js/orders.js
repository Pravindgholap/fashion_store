// Orders functionality
let orders = [];

async function loadOrders() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        showLoading();
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/orders/`);
        
        if (response.ok) {
            orders = await response.json();
            displayOrders();
        } else {
            showAlert('Error loading orders', 'danger');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Error loading orders', 'danger');
    } finally {
        hideLoading();
    }
}

function displayOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-box fa-4x text-muted mb-3"></i>
                <h4>No orders yet</h4>
                <p class="text-muted">Start shopping to see your orders here</p>
                <a href="products.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">Order #${order.order_number}</h6>
                    <small class="text-muted">${formatDate(order.created_at)}</small>
                </div>
                <div class="text-end">
                    <span class="badge bg-${getStatusColor(order.status)} mb-2">${getStatusText(order.status)}</span><br>
                    <strong>${formatPrice(order.total_amount)}</strong>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <p class="mb-1"><strong>${order.items_count}</strong> item(s)</p>
                        ${order.estimated_delivery ? `<p class="mb-0 text-muted">Estimated delivery: ${formatDate(order.estimated_delivery)}</p>` : ''}
                    </div>
                    <div class="col-md-4 text-md-end">
                        <button class="btn btn-outline-primary btn-sm me-2" onclick="viewOrderDetails('${order.order_number}')">
                            View Details
                        </button>
                        ${order.status === 'shipped' || order.status === 'delivered' ? `
                            <button class="btn btn-outline-info btn-sm" onclick="trackOrder('${order.order_number}')">
                                Track Order
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'confirmed': 'info',
        'processing': 'primary',
        'shipped': 'success',
        'delivered': 'success',
        'cancelled': 'danger',
        'refunded': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
        'refunded': 'Refunded'
    };
    return texts[status] || status;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function viewOrderDetails(orderNumber) {
    try {
        showLoading();
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/orders/track/${orderNumber}/`);
        
        if (response.ok) {
            const order = await response.json();
            showOrderDetailsModal(order);
        } else {
            showAlert('Error loading order details', 'danger');
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showAlert('Error loading order details', 'danger');
    } finally {
        hideLoading();
    }
}

function showOrderDetailsModal(order) {
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    
    // Update modal content
    document.getElementById('modalOrderNumber').textContent = order.order_number;
    document.getElementById('modalOrderDate').textContent = formatDate(order.created_at);
    document.getElementById('modalOrderStatus').innerHTML = `
        <span class="badge bg-${getStatusColor(order.status)}">${getStatusText(order.status)}</span>
    `;
    
    // Update items
    const itemsList = document.getElementById('modalOrderItems');
    itemsList.innerHTML = order.items.map(item => `
        <div class="d-flex align-items-center mb-3">
            <img src="${item.product.primary_image || 'https://via.placeholder.com/60x60'}" 
                 alt="${item.product.name}" class="me-3" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div class="flex-grow-1">
                <h6 class="mb-1">${item.product.name}</h6>
                <small class="text-muted">Size: ${item.size} | Color: ${item.color}</small><br>
                <small class="text-muted">Qty: ${item.quantity} × ${formatPrice(item.price)}</small>
            </div>
            <div class="text-end">
                <strong>${formatPrice(item.subtotal)}</strong>
            </div>
        </div>
    `).join('');
    
    // Update shipping address
    document.getElementById('modalShippingAddress').innerHTML = `
        <strong>${order.shipping_name}</strong><br>
        ${order.shipping_address_line1}<br>
        ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br>' : ''}
        ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br>
        ${order.shipping_country}<br>
        <strong>Phone:</strong> ${order.shipping_phone}
    `;
    
    // Update order summary
    document.getElementById('modalSubtotal').textContent = formatPrice(order.subtotal);
    document.getElementById('modalShipping').textContent = formatPrice(order.shipping_cost);
    document.getElementById('modalTax').textContent = formatPrice(order.tax_amount);
    if (order.discount_amount > 0) {
        document.getElementById('modalDiscountRow').style.display = 'table-row';
        document.getElementById('modalDiscount').textContent = `-${formatPrice(order.discount_amount)}`;
    } else {
        document.getElementById('modalDiscountRow').style.display = 'none';
    }
    document.getElementById('modalTotal').textContent = formatPrice(order.total_amount);
    
    // Update tracking
    const trackingList = document.getElementById('modalTracking');
    if (order.tracking_updates && order.tracking_updates.length > 0) {
        trackingList.innerHTML = order.tracking_updates.map(update => `
            <div class="d-flex mb-3">
                <div class="me-3">
                    <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                         style="width: 40px; height: 40px;">
                        <i class="fas fa-check text-white"></i>
                    </div>
                </div>
                <div>
                    <h6 class="mb-1">${getStatusText(update.status)}</h6>
                    <p class="mb-1 small">${update.message}</p>
                    <small class="text-muted">${formatDate(update.created_at)}</small>
                </div>
            </div>
        `).join('');
    } else {
        trackingList.innerHTML = '<p class="text-muted">No tracking updates available</p>';
    }
    
    modal.show();
}

function trackOrder(orderNumber) {
    // For demo purposes, this redirects to order details
    // In a real app, this might show a tracking page
    viewOrderDetails(orderNumber);
}

// Initialize orders page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('orders.html')) {
        loadOrders();
    }
});