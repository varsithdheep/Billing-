const menuGrid = document.getElementById("menu-grid");
const cartList = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const grandTotalEl = document.getElementById("grand-total");
const clearCartBtn = document.getElementById("clear-cart");
const payNowBtn = document.getElementById("pay-now");
const printBtn = document.getElementById("print-bill");
const paymentDialog = document.getElementById("payment-dialog");
const qrTotalEl = document.getElementById("qr-total");
const qrImage = document.getElementById("qr-image");
const toastEl = document.getElementById("toast");
const categoryFilter = document.getElementById("category-filter");
const searchInput = document.getElementById("product-search");

const productTable = document.getElementById("product-table");
const productForm = document.getElementById("product-form");
const productIdInput = document.getElementById("product-id");
const productNameInput = document.getElementById("product-name");
const productCategoryInput = document.getElementById("product-category");
const productPriceInput = document.getElementById("product-price");
const productImageInput = document.getElementById("product-image");
const productActiveInput = document.getElementById("product-active");
const resetFormBtn = document.getElementById("reset-form");
const reportMonthInput = document.getElementById("report-month");
const refreshReportBtn = document.getElementById("refresh-report");
const downloadCsvBtn = document.getElementById("download-csv");
const reportBody = document.getElementById("report-body");

let products = [];
let cart = [];
let lastSale = null;
let searchTerm = "";

function showToast(message, type = "info") {
  toastEl.textContent = message;
  toastEl.style.background = type === "error" ? "#dc2626" : "rgba(15,23,42,0.9)";
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2500);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function renderProducts(list = filteredProducts()) {
  menuGrid.innerHTML = "";
  if (!list.length) {
    const message =
      searchTerm || categoryFilter.value !== "all"
        ? "No products match your search."
        : "No products available.";
    menuGrid.innerHTML = `<p class="muted">${message}</p>`;
    return;
  }
  list.forEach((product) => {
    if (!product.active) return;
    const card = document.createElement("article");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="card-media">
        <img src="${product.imageUrl || "https://via.placeholder.com/300x200?text=Product"}" alt="${product.name}">
        <span class="price-tag">${formatCurrency(product.price)}</span>
      </div>
      <div>
        <h3>${product.name}</h3>
        <p class="muted small">${product.category}</p>
      </div>
      <div class="price-row">
        <span class="price-badge">${formatCurrency(product.price)}</span>
        <span class="price-chip">Tap to add</span>
      </div>
      <button class="primary" data-add="${product.id}">Add to bill</button>
    `;
    card.addEventListener("click", (event) => {
      if (event.target.matches("button[data-add]")) {
        addToCart(product.id);
      } else if (event.target.closest(".menu-card") === card) {
        addToCart(product.id);
      }
    });
    menuGrid.appendChild(card);
  });
}

function refreshCategoryFilter() {
  const previous = categoryFilter.value;
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  if (previous && (previous === "all" || categories.includes(previous))) {
    categoryFilter.value = previous;
  }
}

function filteredProducts() {
  return products.filter((product) => {
    const matchesCategory = categoryFilter.value === "all" || product.category === categoryFilter.value;
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const existing = cart.find((line) => line.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, name: product.name, price: product.price, quantity: 1 });
  }
  renderCart();
  showToast(`${product.name} added to bill`);
}

function updateQuantity(productId, delta) {
  const line = cart.find((item) => item.productId === productId);
  if (!line) return;
  line.quantity += delta;
  if (line.quantity <= 0) {
    cart = cart.filter((item) => item.productId !== productId);
  }
  renderCart();
}

function removeLine(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function renderCart() {
  cartList.innerHTML = "";
  if (cart.length === 0) {
    cartList.innerHTML = '<li class="muted">Cart is empty. Tap items to add them.</li>';
  } else {
    cart.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <p>${formatCurrency(item.price)}</p>
        </div>
        <div class="cart-item-qty">
          <button data-qty="${item.productId}" data-delta="-1">-</button>
          <span>${item.quantity}</span>
          <button data-qty="${item.productId}" data-delta="1">+</button>
          <button data-remove="${item.productId}" title="Remove">✕</button>
        </div>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
      `;
      cartList.appendChild(li);
    });
  }
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  subtotalEl.textContent = formatCurrency(subtotal);
  taxEl.textContent = formatCurrency(tax);
  grandTotalEl.textContent = formatCurrency(total);
}

function bindCartEvents() {
  cartList.addEventListener("click", (event) => {
    const qtyBtn = event.target.closest("button[data-qty]");
    if (qtyBtn) {
      updateQuantity(qtyBtn.dataset.qty, Number(qtyBtn.dataset.delta));
      return;
    }
    const removeBtn = event.target.closest("button[data-remove]");
    if (removeBtn) {
      removeLine(removeBtn.dataset.remove);
    }
  });

  clearCartBtn.addEventListener("click", () => {
    clearCart();
    showToast("Cart cleared");
  });

  printBtn.addEventListener("click", handlePrint);

  payNowBtn.addEventListener("click", () => {
    if (!cart.length) {
      showToast("Add items before paying", "error");
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.05;
    qrTotalEl.textContent = formatCurrency(total);
    const encoded = encodeURIComponent(`upi://pay?pa=freshmart@upi&am=${total.toFixed(2)}`);
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
    paymentDialog.showModal();
  });

  paymentDialog.addEventListener("close", () => {
    if (paymentDialog.returnValue === "confirm") {
      processPayment();
    }
  });
}

async function processPayment() {
  try {
    const payload = {
      items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      paymentMethod: "qr"
    };
    const response = await fetch("/api/sales/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Payment failed");
    }
    lastSale = await response.json();
    showToast("Payment recorded. Bill ready to print.");
    clearCart();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function handlePrint() {
  if (!lastSale && !cart.length) {
    showToast("No bill to print yet", "error");
    return;
  }
  const records = lastSale ? lastSale.items : cart.map((line) => ({
    name: line.name,
    price: line.price,
    quantity: line.quantity,
    lineTotal: line.price * line.quantity
  }));
  const total = records.reduce((sum, item) => sum + item.lineTotal, 0);
  const gst = total * 0.05;
  const html = `
    <html>
      <head>
        <title>FreshMart Bill</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 1.5rem; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
          .totals { margin-top: 1rem; text-align: right; }
        </style>
      </head>
      <body>
        <h1>FreshMart Supermarket</h1>
        <p>Invoice #: ${lastSale ? lastSale.id : "DRAFT"}</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${records
              .map(
                (item) => `<tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.lineTotal)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="totals">
          <p>Subtotal: ${formatCurrency(total)}</p>
          <p>GST (5%): ${formatCurrency(gst)}</p>
          <p><strong>Grand Total: ${formatCurrency(total + gst)}</strong></p>
        </div>
      </body>
    </html>
  `;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

async function fetchProducts() {
  const response = await fetch("/api/products");
  const data = await response.json();
  products = data.products || [];
  refreshCategoryFilter();
  renderProducts();
  populateAdminTable();
}

function populateAdminTable() {
  productTable.innerHTML = "";
  products.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${product.active ? "Available" : "Hidden"}</td>
      <td class="actions">
        <button class="secondary" data-edit="${product.id}">Edit</button>
        <button class="secondary" data-toggle="${product.id}">${product.active ? "Disable" : "Enable"}</button>
        <button class="secondary" data-delete="${product.id}">Delete</button>
      </td>
    `;
    productTable.appendChild(tr);
  });
}

productTable.addEventListener("click", async (event) => {
  const { edit, delete: deleteId, toggle } = event.target.dataset;
  if (edit) {
    const product = products.find((p) => p.id === edit);
    if (!product) return;
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productCategoryInput.value = product.category;
    productPriceInput.value = product.price;
    productImageInput.value = product.imageUrl || "";
    productActiveInput.checked = Boolean(product.active);
    showToast("Loaded product for editing");
  } else if (toggle) {
    const product = products.find((p) => p.id === toggle);
    if (!product) return;
    await patchProduct(toggle, { active: product.active ? 0 : 1 });
  } else if (deleteId) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    showToast("Product removed");
    await fetchProducts();
  }
});

async function patchProduct(id, payload) {
  const response = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Unable to update product");
  }
  showToast("Product updated");
  await fetchProducts();
}

async function saveProduct(id) {
  const name = productNameInput.value.trim();
  const category = productCategoryInput.value.trim();
  const price = parseFloat(productPriceInput.value);
  const imageUrl = productImageInput.value.trim();
  const active = productActiveInput.checked ? 1 : 0;
  const payload = { name, category, price, imageUrl, active };

  const method = id ? "PUT" : "POST";
  const url = id ? `/api/products/${id}` : "/api/products";
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Unable to save product");
  }
  showToast("Product saved");
  productForm.reset();
  document.getElementById("product-active").checked = true;
  productIdInput.value = "";
  await fetchProducts();
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const id = productIdInput.value;
    await saveProduct(id);
  } catch (error) {
    showToast(error.message, "error");
  }
});

resetFormBtn.addEventListener("click", () => {
  productForm.reset();
  productIdInput.value = "";
  productActiveInput.checked = true;
});

function showView(id) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === id);
  });
  document.querySelectorAll(".view-switch button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === id.split("-")[0]);
  });
}

document.querySelector(".view-switch").addEventListener("click", (event) => {
  if (event.target.matches("button[data-view]")) {
    const view = event.target.dataset.view;
    showView(`${view}-view`);
  }
});

categoryFilter.addEventListener("change", () => {
  renderProducts();
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
});

async function loadReports() {
  const month = reportMonthInput.value;
  const response = await fetch(`/api/reports/monthly?month=${month}`);
  const data = await response.json();
  reportBody.innerHTML = "";
  if (!data.records?.length) {
    reportBody.innerHTML = `<tr><td colspan="5">No records for ${month}</td></tr>`;
    return;
  }
  data.records.forEach((record) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.id}</td>
      <td>${new Date(record.createdAt).toLocaleString()}</td>
      <td>${record.paymentMethod}</td>
      <td>${record.itemCount}</td>
      <td>${formatCurrency(record.total)}</td>
    `;
    reportBody.appendChild(tr);
  });
}

refreshReportBtn.addEventListener("click", loadReports);

downloadCsvBtn.addEventListener("click", () => {
  const month = reportMonthInput.value;
  window.open(`/api/reports/monthly?month=${month}&format=csv`, "_blank");
});

function init() {
  const now = new Date();
  const isoMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  reportMonthInput.value = isoMonth;
  bindCartEvents();
  fetchProducts();
  loadReports();
}

init();

