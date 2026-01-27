/**
 * Admin Panel - Supabase Real-Time Orders
 * Fetches and displays orders from Supabase database
 */

let allOrders = [];
let filteredOrders = [];
let currentFilter = 'all';
let autoRefreshInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin panel loaded');
  waitForSupabaseAndLoad();
  
  // Verify Supabase is initialized
  setTimeout(() => {
    if (!window.supabase || !window.supabaseInitialized) {
      showError('⚠️ Supabase not initialized. Check supabase-config.js configuration.');
    }
  }, 2000);
});

/**
 * Wait for Supabase to be fully initialized, then load orders
 */
async function waitForSupabaseAndLoad() {
  let attempts = 0;
  const maxAttempts = 50; // Wait up to 5 seconds (50 * 100ms)
  
  while (attempts < maxAttempts && (!window.supabase || !window.supabaseInitialized)) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.supabase && window.supabaseInitialized) {
    console.log('✅ Supabase ready, loading orders...');
    loadOrders();
  } else {
    console.error('❌ Supabase failed to initialize after waiting');
    showError('❌ Failed to initialize database. Please refresh the page.');
  }
}

/**
 * Load orders from Supabase
 */
async function loadOrders() {
  const container = document.getElementById('ordersContainer');
  
  // Check if Supabase is initialized
  if (!window.supabase || !window.supabaseInitialized) {
    container.innerHTML = '<div class="error" style="padding: 20px;">❌ Database not initialized. Please refresh the page.</div>';
    return;
  }
  
  container.innerHTML = '<div class="loading">Loading orders...</div>';

  try {
    const orders = await fetchAllOrders();
    allOrders = orders;
    filteredOrders = orders;
    
    updateStats();
    displayOrders(orders);
    
    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🍽️</div>
          <p>No orders yet. Wait for customers to place orders!</p>
          <p style="font-size: 12px; margin-top: 10px; opacity: 0.6;">Orders will appear here in real-time</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading orders:', err);
    showError('Failed to load orders. Check console for details.');
    container.innerHTML = `<div class="error" style="padding: 20px;">❌ Error: ${err.message}</div>`;
  }
}

/**
 * Display orders in the grid
 */
function displayOrders(orders) {
  const container = document.getElementById('ordersContainer');
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📭</div>
        <p>No orders match the current filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((order, idx) => `
    <div class="order-card" style="animation-delay: ${idx * 50}ms;">
      <div class="order-header">
        <div>
          <div class="order-id">Order #${order.id}</div>
          <div style="margin-top: 4px; font-size: 14px; font-weight: 500;">${formatOrderDate(order.created_at)}</div>
        </div>
        <span class="status-badge status-${order.order_status.toLowerCase()}">
          ${order.order_status}
        </span>
      </div>

      <div class="order-customer">
        <div class="customer-name">👤 ${escapeHtml(order.customer_name)}</div>
        <div class="customer-address">📍 ${escapeHtml(order.customer_address)}</div>
      </div>

      <div class="order-items">
        <div class="order-items-title">Items</div>
        ${formatOrderItems(order.items)}
      </div>

      <div class="order-total">Total: ₹${formatCurrency(order.total_amount)}</div>

      <div class="order-actions">
        ${getStatusButtons(order)}
      </div>
    </div>
  `).join('');
}

/**
 * Get status change buttons for an order
 */
function getStatusButtons(order) {
  const statuses = ['Pending', 'Confirmed', 'Preparing', 'Ready'];
  
  return statuses.map(status => `
    <button 
      class="status-btn ${status.toLowerCase()}"
      onclick="changeOrderStatus(${order.id}, '${status}')"
      ${order.order_status === status ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
    >
      ${status}
    </button>
  `).join('');
}

/**
 * Change order status
 */
async function changeOrderStatus(orderId, newStatus) {
  try {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      showSuccess(`✅ Order status updated to ${newStatus}`);
      // Reload orders to reflect change
      setTimeout(() => loadOrders(), 500);
    } else {
      showError(`❌ Failed to update status: ${result.error}`);
    }
  } catch (err) {
    console.error('Error changing status:', err);
    showError('Failed to update order status');
  }
}

/**
 * Filter orders by status
 */
function filterOrders(status) {
  currentFilter = status;
  
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Filter orders
  if (status === 'all') {
    filteredOrders = allOrders;
  } else {
    filteredOrders = allOrders.filter(o => o.order_status === status);
  }

  displayOrders(filteredOrders);
  updateStats();
}

/**
 * Update statistics
 */
function updateStats() {
  const totalOrders = allOrders.length;
  const todayOrders = allOrders.filter(o => isToday(o.created_at)).length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingCount = allOrders.filter(o => o.order_status === 'Pending').length;

  document.getElementById('totalOrders').textContent = totalOrders;
  document.getElementById('todayOrders').textContent = todayOrders;
  document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('pendingCount').textContent = pendingCount;
}

/**
 * Toggle auto-refresh
 */
function toggleAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    document.getElementById('autoRefreshText').textContent = 'Enable Auto-Refresh';
    showSuccess('Auto-refresh disabled');
  } else {
    autoRefreshInterval = setInterval(() => {
      loadOrders();
    }, 5000); // Refresh every 5 seconds
    document.getElementById('autoRefreshText').textContent = 'Disable Auto-Refresh';
    showSuccess('Auto-refresh enabled (5s interval)');
  }
}

/**
 * Export orders as CSV
 */
function exportOrders() {
  if (allOrders.length === 0) {
    showError('No orders to export');
    return;
  }

  // Create CSV header
  let csv = 'Order ID,Date & Time,Customer Name,Address,Items,Total,Status\n';

  // Add order rows
  allOrders.forEach(order => {
    const items = formatOrderItemsText(order.items);
    const dateTime = formatOrderDate(order.created_at);
    csv += `"${order.id}","${dateTime}","${order.customer_name}","${order.customer_address}","${items}",₹${order.total_amount},"${order.order_status}"\n`;
  });

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SAN-Orders-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  showSuccess('✅ Orders exported as CSV');
}

/**
 * Format order items for display
 */
function formatOrderItems(items) {
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      return '<div class="order-item">Unable to parse items</div>';
    }
  }

  if (!items || typeof items !== 'object') {
    return '<div class="order-item">No items</div>';
  }

  return Object.entries(items)
    .map(([name, {qty, price}]) => 
      `<div class="order-item">${escapeHtml(name)} × ${qty} = ₹${formatCurrency(qty * price)}</div>`
    )
    .join('');
}

/**
 * Format order items as text (for CSV export)
 */
function formatOrderItemsText(items) {
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      return 'Unable to parse items';
    }
  }

  if (!items || typeof items !== 'object') {
    return 'No items';
  }

  return Object.entries(items)
    .map(([name, {qty, price}]) => `${name} × ${qty}`)
    .join('; ');
}

/**
 * Format date and time
 */
function formatOrderDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Check if date is today
 */
function isToday(dateString) {
  try {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

/**
 * Format currency (remove decimals if whole number)
 */
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return Number.isInteger(num) ? num : num.toFixed(2);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

/**
 * Show success message
 */
function showSuccess(message) {
  const container = document.getElementById('statusMessage');
  container.innerHTML = `<div class="success">${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 4000);
}

/**
 * Show error message
 */
function showError(message) {
  const container = document.getElementById('statusMessage');
  container.innerHTML = `<div class="error">${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

/**
 * Subscribe to real-time updates (if enabled in Supabase)
 */
function setupRealtimeListener() {
  const subscription = subscribeToOrders((newOrder) => {
    console.log('🔄 New order received:', newOrder);
    allOrders.unshift(newOrder); // Add to top
    
    // Re-apply filter
    if (currentFilter !== 'all') {
      if (newOrder.order_status === currentFilter) {
        filteredOrders.unshift(newOrder);
      }
    } else {
      filteredOrders.unshift(newOrder);
    }
    
    // Update display
    displayOrders(filteredOrders);
    updateStats();
    showSuccess('📬 New order received!');
  });

  return subscription;
}

// Set up real-time updates when page loads
window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.supabase) {
      setupRealtimeListener();
    }
  }, 2000);
});
