/* ================= ADMIN PANEL LOGIC ================= */

// ===== CONFIGURATION =====
const ADMIN_PASSWORD = "SAN20"; // Change this to your desired password
const SESSION_KEY = "san_admin_session";
const STATS_KEY = "san_stats";

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if admin is already logged in
  if (isAdminLoggedIn()) {
    showAdminDashboard();
  } else {
    showLoginScreen();
  }

  // Handle login form submission
  document.getElementById('loginForm').addEventListener('submit', adminLogin);
});

// ===== SESSION MANAGEMENT =====

/**
 * Check if the current session is authenticated
 */
function isAdminLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

/**
 * Handle admin login
 */
function adminLogin(e) {
  e.preventDefault();
  const password = document.getElementById('passwordInput').value;
  const errorMsg = document.getElementById('loginError');

  if (password === ADMIN_PASSWORD) {
    // Set session flag
    sessionStorage.setItem(SESSION_KEY, 'true');
    errorMsg.style.display = 'none';
    showAdminDashboard();
  } else {
    // Show error
    errorMsg.style.display = 'block';
    document.getElementById('passwordInput').value = '';
  }
}

/**
 * Handle admin logout
 */
function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('passwordInput').value = '';
  showLoginScreen();
}

// ===== UI MANAGEMENT =====

/**
 * Show login screen, hide dashboard
 */
function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminScreen').style.display = 'none';
  document.getElementById('passwordInput').focus();
}

/**
 * Show dashboard, hide login screen
 */
function showAdminDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminScreen').style.display = 'block';
  loadAndDisplayStats();
}

// ===== STATS RETRIEVAL & DISPLAY =====

/**
 * Get stats from localStorage
 */
function getStats() {
  const defaultStats = {
    totalOrders: 0,
    totalRevenue: 0,
    lastOrderTime: null,
    itemCounts: {}
  };
  const stored = localStorage.getItem(STATS_KEY);
  return stored ? JSON.parse(stored) : defaultStats;
}

/**
 * Load stats and update the dashboard display
 */
function loadAndDisplayStats() {
  const stats = getStats();

  // Update summary cards
  document.getElementById('totalOrdersDisplay').textContent = stats.totalOrders;
  document.getElementById('totalRevenueDisplay').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
  document.getElementById('lastOrderDisplay').textContent = stats.lastOrderTime || '—';

  // Update items table
  displayItemStats(stats.itemCounts);
}

/**
 * Display item-wise order counts in the table
 */
function displayItemStats(itemCounts) {
  const tableBody = document.getElementById('itemsTableBody');
  
  // Convert to array and sort by quantity (descending)
  const sortedItems = Object.entries(itemCounts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  // Clear previous rows
  tableBody.innerHTML = '';

  if (sortedItems.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3" class="empty-message">No orders yet</td></tr>';
    return;
  }

  // Add rows
  sortedItems.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="rank">#${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${item.qty}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ===== ADMIN ACTIONS =====

/**
 * Export stats as JSON file
 */
function adminExportStats() {
  const stats = getStats();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `san_stats_${timestamp}.json`;

  // Create blob and download
  const dataStr = JSON.stringify(stats, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  alert(`Stats exported as ${filename}`);
}

/**
 * Clear all stats (with confirmation)
 */
function adminClearStats() {
  if (confirm('⚠️ Are you sure you want to delete ALL stats? This cannot be undone.')) {
    localStorage.removeItem(STATS_KEY);
    loadAndDisplayStats();
    alert('✅ All stats have been cleared.');
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
