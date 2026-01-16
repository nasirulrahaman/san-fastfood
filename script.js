console.log("JS loaded");

// ===== FIREBASE (OPTIONAL - will gracefully fail if unavailable) =====
let db = null;
let collection = null;
let addDoc = null;
let serverTimestamp = null;

// Note: Firebase imports are skipped for now - localStorage is used instead
// To enable Firebase, set up credentials in firebase-config.js and uncommentiates below

const menuData = {

  rice: [
    {name:"Aloo Biryani", price:60, img:"images/rice/Aloo-Biryani.jpg"},
    {name:"Egg Biryani", price:70, img:"images/rice/egg-biryani.jpg"},
    {name:"Chicken Biryani", price:90, img:"images/rice/2.jpg"},
    {name:"Chicken Biryani (with egg)", price:99, img:"images/rice/withegg.jpg"},
    {name:"Beef Biryani", price:110, img:"images/rice/beef.jpg"},
    {name:"Lemon Rice (with chicken 65)", price:80, img:"images/rice/lemon.jpg"},
    {name:"Tomato Rice (with chicken 65 & egg)", price:90, img:"images/rice/tomato-rice.jpg"},
    {name:"Jeera Rice (with chicken 65)", price:70, img:"images/rice/jeera.jpg"}
  ],

  breakfast: [
    {name:"Rice Roti", price:5, img:"images/breakfast/rice.jpg"},
    {name:"Masala Dosa", price:25, img:"images/breakfast/m.jpg"},
    {name:"Butter Naan", price:10, img:"images/breakfast/butter.jpg"},
    {name:"Idly (1 plate)", price:20, img:"images/breakfast/idly.jpg"},
    {name:"Dal Puri", price:5, img:"images/breakfast/dal.jpg"},
    {name:"Dhuki", price:10, img:"images/breakfast/dhuki.jpg"},
    {name:"Paratha", price:10, img:"images/breakfast/p.jpg"},
    {name:"Chicken Chawmin", price:40, img:"images/breakfast/c.jpg"},
    {name:"Dosa", price:10, img:"images/breakfast/d.jpg"},
    {name:"Pati Sapta", price:15, img:"images/breakfast/pa.jpg"},
    {name:"Chowmein", price:25, img:"images/breakfast/ch.jpg"}
  ],

  chicken: [
    {name:"Chicken 65", price:40, img:"images/chicken/65.jpg"},
    {name:"Chicken Tandoori", price:80, img:"images/chicken/tandoori.jpg"},
    {name:"Chicken Leg Piece", price:50, img:"images/chicken/leg.jpg"},
    {name:"Chicken Lollipop", price:20, img:"images/chicken/lollipop.jpg"},
    {name:"Chicken Kosa", price:80, img:"images/chicken/kosa.jpg"},
    {name:"Butter Chicken", price:50, img:"images/chicken/butter.jpg"},
    {name:"Chicken Keema", price:40, img:"images/chicken/keema.jpg"},
    {name:"Chilli Chicken", price:50, img:"images/chicken/chilli.jpg"},
    {name:"Chicken Stick ( per stick)", price:20, img:"images/chicken/chi.jpg"}
  ],

  momo: [
    {name:"Steam Momo (8 piece)", price:50, img:"images/momo/steam.jpg"},
    {name:"Fry Momo (8 piece)", price:60, img:"images/momo/fry.jpg"},
    {name:"Kurkure Momo (8 piece)", price:60, img:"images/momo/k.jpg"},
    {name:"Veg Momo (8 piece)", price:40, img:"images/momo/veg.jpg"}
  ],

  snacks: [
    {name:"Potato Smile (6 piece)", price:25, img:"images/snacks/sm.jpg"},
    {name:"Dahi Vada (1 plate)", price:20, img:"images/snacks/D.jpg"},
    {name:"French Fries", price:40, img:"images/snacks/f.jpg"},
    {name:"Beef Tikka", price:5, img:"images/snacks/beef.jpg"},
    {name:"Medu Vada", price:10, img:"images/snacks/m.jpg"},
    {name:"Dal Vada", price:5, img:"images/snacks/dal.jpg"},
    {name:"Mini Samosa (6 piece)", price:20, img:"images/snacks/mini.jpg"},
    {name:"Soya Stick", price:10, img:"images/snacks/soya.jpg"},
    {name:"Sandwich (1 plate)", price:15, img:"images/snacks/sandwich.jpg"},
    {name:"Laccha Patties", price:20, img:"images/snacks/l.jpg"},
    {name:"Aloo Chop", price:5, img:"images/snacks/a.jpg"},
    {name:"Piyaji", price:5, img:"images/snacks/piyaji.jpg"},
    {name:"Beguni", price:5, img:"images/snacks/b.jpg"},
    {name:"Papad", price:5, img:"images/snacks/p.jpg"}
  ],

  rolls: [
    {name:"Spring Roll", price:15, img:"images/roll/spring.jpg"},
    {name:"Naan Roll", price:15, img:"images/roll/naan.jpg"},
    {name:"Egg Roll", price:25, img:"images/roll/egg.jpg"},
    {name:"Crispy Roll", price:25, img:"images/roll/crispy.jpg"}
  ],

  drinks: [
    {name:"Tea", price:5, img:"images/drinks/t.jpg"},
    {name:"Coffee", price:10, img:"images/drinks/c.jpg"},
    {name:"Lassi", price:15, img:"images/drinks/l.jpg"}
  ]
};

let cart = {};
let lastSelectedCategory = null; // Store last selected category

/* ================= SEARCH FUNCTIONALITY ================= */
function handleSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.trim().toLowerCase();
  const clearBtn = document.getElementById('clearBtn');
  const menu = document.getElementById('menu');

  // Show/hide clear button
  if (searchTerm.length > 0) {
    clearBtn.style.display = 'inline-block';
  } else {
    clearBtn.style.display = 'none';
    // If search is empty, show the last selected category menu
    if (lastSelectedCategory) {
      showMenu(lastSelectedCategory);
    }
    return;
  }

  // Search across all categories
  const searchResults = [];
  for (let category in menuData) {
    menuData[category].forEach(item => {
      if (item.name.toLowerCase().includes(searchTerm)) {
        searchResults.push(item);
      }
    });
  }

  // Display search results
  menu.innerHTML = "";
  if (searchResults.length === 0) {
    menu.innerHTML = '<div class="no-results">No items found. Try a different search.</div>';
  } else {
    searchResults.forEach(item => {
      const safeId = item.name.replace(/\s+/g, "_");
      menu.innerHTML += `
        <div class="item">
          <img src="${item.img}">
          <h3>${item.name}</h3>
          <p>₹${item.price}</p>
          <div class="qty">
            <button onclick="changeQty('${safeId}', '${item.name}', ${item.price}, -1)">−</button>
            <span id="q-${safeId}">0</span>
            <button onclick="changeQty('${safeId}', '${item.name}', ${item.price}, 1)">+</button>
          </div>
        </div>
      `;
    });
  }
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('clearBtn').style.display = 'none';
  if (lastSelectedCategory) {
    showMenu(lastSelectedCategory);
  }
}

function showMenu(category) {
  // Validate category exists in menuData
  if (!category || !menuData[category]) {
    console.warn(`❌ Category not found: "${category}". Available categories:`, Object.keys(menuData));
    document.getElementById("menu").innerHTML = `
      <div class="empty-message" style="padding: 40px; text-align: center; opacity: 0.6;">
        Category not available. Please select another.
      </div>
    `;
    return;
  }

  const items = menuData[category];

  // Validate items array exists and has content
  if (!Array.isArray(items) || items.length === 0) {
    console.warn(`⚠️ No items found in category: "${category}"`);
    document.getElementById("menu").innerHTML = `
      <div class="empty-message" style="padding: 40px; text-align: center; opacity: 0.6;">
        No items in this category.
      </div>
    `;
    return;
  }

  lastSelectedCategory = category; // Store the selected category
  document.getElementById('searchInput').value = ''; // Clear search input
  document.getElementById('clearBtn').style.display = 'none';
  const menu = document.getElementById("menu");
  menu.innerHTML = "";

  // Update active category button
  document.querySelectorAll('.categories button').forEach(btn => {
    btn.classList.remove('active');
  });
  event?.target?.classList.add('active');

  items.forEach(item => {
    // Validate item has required fields
    if (!item.name || !item.price) {
      console.warn('⚠️ Invalid item (missing name or price):', item);
      return; // Skip this item
    }

    const safeId = item.name.replace(/\s+/g, "_");

    menu.innerHTML += `
      <div class="item">
        <img src="${item.img}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
        <div class="qty">
          <button onclick="changeQty('${safeId}', '${item.name}', ${item.price}, -1)">−</button>
          <span id="q-${safeId}">0</span>
          <button onclick="changeQty('${safeId}', '${item.name}', ${item.price}, 1)">+</button>
        </div>
      </div>
    `;
  });

  console.log(`✅ Menu loaded: "${category}" (${items.length} items)`);
}

function changeQty(id, name, price, delta) {
  if (!cart[id]) cart[id] = { name, qty: 0, price };

  cart[id].qty += delta;

  if (cart[id].qty <= 0) {
    delete cart[id];
    document.getElementById("q-" + id).innerText = 0;
  } else {
    document.getElementById("q-" + id).innerText = cart[id].qty;
  }

  updateFloatingCart();
}


function cssSafe(text) {
  return text.replace(/\s+/g, "_");
}


/* ================= CHECKOUT POPUP ================= */

function openCart() {
  const box = document.getElementById("cartItems");
  box.innerHTML = "";
  let total = 0;

  for (let item in cart) {
    const {qty, price} = cart[item];
    total += qty * price;
    box.innerHTML += `<p>${item} × ${qty} = ₹${qty*price}</p>`;
  }

  document.getElementById("total").innerText = "Total: ₹" + total;
  document.getElementById("cart").classList.remove("hidden");
}

function closeCart() {
  document.getElementById("cart").classList.add("hidden");
}

/* ================= FIRESTORE ORDER FUNCTIONS ================= */

/**
 * Save order to Firestore database
 */
async function saveOrderToFirestore(orderData) {
  try {
    // Skip if Firebase is not available
    if (!db || !collection || !addDoc || !serverTimestamp) {
      console.log("ℹ️ Firebase not available, skipping Firestore save");
      return null;
    }

    // Convert cart object to array format for Firestore
    const itemsArray = Object.keys(orderData.items).map(itemKey => ({
      name: orderData.items[itemKey].name,
      quantity: orderData.items[itemKey].qty,
      price: orderData.items[itemKey].price,
      subtotal: orderData.items[itemKey].qty * orderData.items[itemKey].price
    }));

    // Prepare order document
    const orderDoc = {
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      customerAddress: orderData.customerAddress,
      items: itemsArray,
      totalAmount: orderData.total,
      timestamp: serverTimestamp(), // Firebase server timestamp
      createdAt: new Date().toLocaleString(),
      status: "pending" // pending, confirmed, delivered
    };

    // Save to Firestore 'orders' collection
    const docRef = await addDoc(collection(db, "orders"), orderDoc);
    console.log("✅ Order saved to Firestore with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error saving order to Firestore:", error);
    // Don't block user - still allow WhatsApp redirect even if Firestore fails
    return null;
  }
}

/* ================= WHATSAPP ORDER ================= */

function generateOrderId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `SAN-${year}${month}${day}-${random}`;
}

/* ================= STATS & ADMIN FUNCTIONS (LOCAL DEVICE ONLY) ================= */

/**
 * Save order statistics to localStorage (DEVICE ONLY)
 * This only tracks stats from this specific browser/device
 */
function saveOrderStats(orderData) {
  try {
    // Validate order data
    if (!orderData || !orderData.items || orderData.total === undefined) {
      console.warn('⚠️ Invalid order data for stats:', orderData);
      return;
    }

    // Get existing stats from localStorage
    let stats = {
      totalOrders: 0,
      totalRevenue: 0,
      lastOrderTime: null,
      itemCounts: {},
      orders: [] // Store full order records
    };

    // Try to parse existing stats
    try {
      const stored = localStorage.getItem('san_stats');
      if (stored) {
        stats = JSON.parse(stored);
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse existing stats, starting fresh:', parseError);
      // Continue with fresh stats
    }

    // Ensure data integrity
    if (typeof stats.totalOrders !== 'number') stats.totalOrders = 0;
    if (typeof stats.totalRevenue !== 'number') stats.totalRevenue = 0;
    if (typeof stats.itemCounts !== 'object') stats.itemCounts = {};
    if (!Array.isArray(stats.orders)) stats.orders = [];

    // Update counters
    stats.totalOrders = (stats.totalOrders || 0) + 1;
    stats.totalRevenue = (stats.totalRevenue || 0) + orderData.total;
    stats.lastOrderTime = orderData.timestamp;

    // Update item counts
    for (let itemKey in orderData.items) {
      const item = orderData.items[itemKey];
      if (item && item.qty > 0) {
        // Use actual item name if available, otherwise use key
        const itemName = item.name || itemKey;
        if (!stats.itemCounts[itemName]) {
          stats.itemCounts[itemName] = 0;
        }
        stats.itemCounts[itemName] = (stats.itemCounts[itemName] || 0) + item.qty;
      }
    }

    // Store full order record (keep last 100 orders)
    stats.orders.unshift({
      orderId: orderData.orderId,
      timestamp: orderData.timestamp,
      total: orderData.total,
      items: orderData.items
    });
    if (stats.orders.length > 100) {
      stats.orders = stats.orders.slice(0, 100);
    }

    // Save updated stats
    localStorage.setItem('san_stats', JSON.stringify(stats));
    console.log('✅ Order stats saved (device only):', stats);

    // Notify admin panel if it's open
    window.dispatchEvent(new CustomEvent('statsUpdated', { detail: stats }));

  } catch (error) {
    console.error('❌ Error saving order stats:', error);
  }
}

function orderWhatsApp() {
  if (Object.keys(cart).length === 0) {
    alert("Please add items to cart");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const address = document.getElementById("custAddress").value.trim();

  if (!name || !address) {
    alert("Please enter name and address");
    return;
  }

  const orderId = generateOrderId();
  const now = new Date();
  const timestamp = now.toLocaleString();

  let total = 0;
  let message = `Hello SAN FASTFOOD 👋\n\n`;
  message += `Order ID: ${orderId}\n`;
  message += `Timestamp: ${timestamp}\n\n`;
  message += `Name: ${name}\n`;
  message += `Address: ${address}\n\n`;
  message += `My Order:\n`;

  for (let item in cart) {
    const { qty, price } = cart[item];
    total += qty * price;
    message += `• ${item} × ${qty} = ₹${qty * price}\n`;
  }

  message += `\nTotal: ₹${total}`;
  message += `\n\n💰 50% advance payment required`;
  message += `\n🚚 Balance payable at delivery`;

  // Save order to Firestore (async)
  saveOrderToFirestore({
    orderId,
    customerName: name,
    customerAddress: address,
    total,
    items: cart
  });

  // Save order stats to localStorage (for backwards compatibility)
  saveOrderStats({
    orderId,
    timestamp,
    total,
    items: cart
  });

  const phone = "918293062407";
  const encodedMsg = encodeURIComponent(message);

  window.location.href = `https://wa.me/${phone}?text=${encodedMsg}`;
}
function scrollToMenu() {
  document.querySelector(".categories")?.scrollIntoView({
    behavior: "smooth"
  });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'block';
});

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        const banner = document.getElementById('installBanner');
        if (banner) banner.style.display = 'none';
      }
      deferredPrompt = null;
    });
  }
});
function updateFloatingCart() {
  let totalItems = 0;
  let totalPrice = 0;

  for (let key in cart) {
    totalItems += cart[key].qty;
    totalPrice += cart[key].qty * cart[key].price;
  }

  const bar = document.getElementById("floating-cart");
  const text = document.getElementById("cart-summary");

  if (totalItems > 0) {
    text.innerText = `🛒 ${totalItems} items | ₹${totalPrice}`;
    bar.classList.add("visible");
  } else {
    bar.classList.remove("visible");
  }
}

function openCart() {
  const cartModal = document.getElementById("cart");
  const backdrop = document.getElementById("cart-backdrop");
  const floatingCart = document.getElementById("floating-cart");
  
  cartModal.classList.remove("hidden");
  if (backdrop) backdrop.classList.remove("hidden");
  if (floatingCart) floatingCart.style.display = "none";
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = "hidden";
}

function closeCart() {
  const cartModal = document.getElementById("cart");
  const backdrop = document.getElementById("cart-backdrop");
  const floatingCart = document.getElementById("floating-cart");
  
  cartModal.classList.add("hidden");
  if (backdrop) backdrop.classList.add("hidden");
  if (floatingCart && floatingCart.classList.contains("visible")) {
    floatingCart.style.display = "";
  }
  
  // Restore body scroll
  document.body.style.overflow = "";
}