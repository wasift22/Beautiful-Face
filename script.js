// ========================--
// 1. HAMBURGER MENU
// ========================--
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (toggle && nav) {
    toggle.addEventListener("click", function () {
        const isOpen = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen);
        toggle.textContent = isOpen ? "✕" : "☰";
    });

    nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            nav.classList.remove("open");
            toggle.textContent = "☰";
        });
    });
}

// ==========================
// 2. ABOUT CART
// ==========================
const DELIVERY_FEE = 0; // delivery free then 0

function getCart() {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
    let total = 0;
    getCart().forEach(function (item) {
        total += item.qty;
    });
    document.querySelectorAll(".cart-count").forEach(function (el) {
        el.textContent = total;
    });
}

function addToCart(id) {
    const cart = getCart();
    const found = cart.find(function (item) {
        return item.id === id;
    });

    if (found) {
        found.qty++;
    } else {
        cart.push({ id: id, qty: 1 });
    }

    saveCart(cart);
    updateCartCount();
}

// ==========================
// 3. PRODUCTS: CARDS, FILTER AND SORT
// ==========================
const productList = document.getElementById("product-list");
const shopToolbar = document.getElementById("shop-toolbar");
const sortSelect = document.getElementById("sort-select");
const resultCount = document.getElementById("result-count");
const searchMessage = document.getElementById("search-message");

// URL se search ka lafz (shop.html?q=scrub)
const params = new URLSearchParams(window.location.search);
const rawQuery = params.get("q") || "";
const query = rawQuery.trim().toLowerCase();

// Customer ne abhi kya chuna hai
// let currentCategory = "all";
let currentCategory = params.get("cat") || "all";
let currentSort = "default";

function makeStars(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
}

function getDiscount(p) {
    if (p.oldPrice && p.oldPrice > p.price) {
        return Math.round((1 - p.price / p.oldPrice) * 100);
    }
    return 0;
}


function makeCard(p) {
    const discount = getDiscount(p);
    let badge = "";
    let oldPriceHtml = "";

    if (discount > 0) {
        badge = '<span class="badge">-' + discount + "%</span>";
        oldPriceHtml = '<del class="old-price">SAR ' + p.oldPrice + "</del>";
    }

    return `
    <article class="product-card">
        ${badge}
        <a href="product.html?id=${p.id}">
            <img src="${p.image}" alt="${p.name}">
        </a>
        <div class="product-info">
            <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
            <div class="rating">
                <span class="stars">${makeStars(p.rating)}</span>
                <span class="review-count">(${p.reviews})</span>
            </div>
            <div class="price-row">
                <span class="price">SAR ${p.price}</span>
                ${oldPriceHtml}
            </div>
            <button type="button" class="btn add-to-cart" data-id="${p.id}">Add to Cart</button>
        </div>
    </article>`;
}

// Qadam 1: list ko chhanna (filter) aur tarteeb dena (sort)

function getVisibleProducts() {
    const list = products.filter(function (p) {
        const okCategory =
            currentCategory === "all" ||
            (currentCategory === "offers" && getDiscount(p) > 0) ||
            p.category === currentCategory;

        const okSearch = !shopToolbar || !query || p.name.toLowerCase().includes(query);

        return okCategory && okSearch;
    });

    list.sort(function (a, b) {
        if (currentSort === "price-asc") return a.price - b.price;
        if (currentSort === "price-desc") return b.price - a.price;
        if (currentSort === "discount") return getDiscount(b) - getDiscount(a);
        if (currentSort === "rating") {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.reviews - a.reviews;
        }
        return a.id - b.id;
    });

    return list;
}

// Qadam 2: bachi hui list ke cards banana
function renderProducts() {
    if (!productList || typeof products === "undefined") return;

    const list = getVisibleProducts();
    let html = "";

    list.forEach(function (p) {
        html += makeCard(p);
    });

    if (list.length === 0) {
        html = '<p class="no-results">No products found. Try another category or search.</p>';
    }

    productList.innerHTML = html;

    if (resultCount) {
        resultCount.textContent = list.length + (list.length === 1 ? " product" : " products");
    }

    if (searchMessage) {
        searchMessage.textContent = query ? 'Showing results for "' + rawQuery + '"' : "";
    }
}

// Category buttons
if (shopToolbar) {
    shopToolbar.addEventListener("click", function (e) {
        const chip = e.target.closest(".chip");
        if (!chip) return;

        currentCategory = chip.dataset.category;

        shopToolbar.querySelectorAll(".chip").forEach(function (c) {
            c.classList.toggle("active", c === chip);
        });

        renderProducts();
    });
}
if (shopToolbar) {
    shopToolbar.querySelectorAll(".chip").forEach(function (c) {
        c.classList.toggle("active", c.dataset.category === currentCategory);
    });
}
// Sort ka dropdown
if (sortSelect) {
    sortSelect.addEventListener("change", function () {
        currentSort = sortSelect.value;
        renderProducts();
    });
}

// ==========================
// 4. ADD TO CART BUTTON
// ==========================
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    addToCart(Number(btn.dataset.id));

    btn.textContent = "Added ✓";
    setTimeout(function () {
        btn.textContent = "Add to Cart";
    }, 1200);
});

// ==========================
// 5. CART PAGE
// ==========================
const cartItemsBox = document.getElementById("cart-items");

function renderCart() {
    if (!cartItemsBox) return;

    const cart = getCart();
    const layout = document.getElementById("cart-layout");
    const summary = document.getElementById("summary");
    const head = document.getElementById("cart-head");
    const title = document.getElementById("cart-title");

    let subtotal = 0;
    let count = 0;
    let html = "";
    const lines = [];

    cart.forEach(function (item) {
        const p = products.find(function (x) {
            return x.id === item.id;
        });
        if (!p) return;

        const lineTotal = p.price * item.qty;
        subtotal += lineTotal;
        count += item.qty;
        lines.push(item.qty + " x " + p.name + " = SAR " + lineTotal);

        html += `
        <article class="cart-item">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <div class="cart-details">
                <h3>${p.name}</h3>
                <p class="price">SAR ${p.price}</p>
            </div>
            <div class="qty">
                <button type="button" data-action="minus" data-id="${p.id}" aria-label="Decrease">-</button>
                <span>${item.qty}</span>
                <button type="button" data-action="plus" data-id="${p.id}" aria-label="Increase">+</button>
            </div>
            <strong>SAR ${lineTotal}</strong>
            <button type="button" class="remove" data-action="remove" data-id="${p.id}">Remove</button>
        </article>`;
    });

    const isEmpty = count === 0;

    if (isEmpty) {
        html = `
        <div class="empty-cart">
            <div class="empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Looks like you have not added anything yet.</p>
            <a href="shop.html" class="btn">Start Shopping</a>
        </div>`;
    }

    cartItemsBox.innerHTML = html;
    head.hidden = isEmpty;
    summary.hidden = isEmpty;
    layout.classList.toggle("cart-empty", isEmpty);
    title.textContent = "Your Items (" + count + ")";

    const total = subtotal + DELIVERY_FEE;
    document.getElementById("subtotal").textContent = "SAR " + subtotal;
    document.getElementById("delivery").textContent = DELIVERY_FEE === 0 ? "Free" : "SAR " + DELIVERY_FEE;
    document.getElementById("total").textContent = "SAR " + total;

    const text = "Hello, I want to order:\n" + lines.join("\n") + "\nTotal: SAR " + total;
    document.getElementById("whatsapp-order").href =
        "https://wa.me/966576756048?text=" + encodeURIComponent(text);
}

// + , - aur Remove
document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    let cart = getCart();
    const item = cart.find(function (i) {
        return i.id === id;
    });
    if (!item) return;

    if (action === "plus") item.qty++;
    if (action === "minus") item.qty--;

    if (action === "remove" || item.qty <= 0) {
        cart = cart.filter(function (i) {
            return i.id !== id;
        });
    }

    saveCart(cart);
    updateCartCount();
    renderCart();
});

// Clear Cart
const clearBtn = document.getElementById("clear-cart");
if (clearBtn) {
    clearBtn.addEventListener("click", function () {
        if (confirm("Remove all items from your cart?")) {
            saveCart([]);
            updateCartCount();
            renderCart();
        }
    });
}

// ==========================
// 6. CONTACT FORM:  FOR WHATSAPP
// ==========================
const contactForm = document.getElementById("contact-form");
const waBtn = document.getElementById("send-whatsapp");

if (contactForm && waBtn) {
    waBtn.addEventListener("click", function () {
        if (!contactForm.reportValidity()) return;

        const data = new FormData(contactForm);
        const text =
            "Hello, I am " + data.get("name") +
            "\nPhone: " + data.get("phone") +
            "\nReason: " + data.get("reason") +
            "\nMessage: " + data.get("message");

        window.open("https://wa.me/966576756048?text=" + encodeURIComponent(text), "_blank");
    });
}

// ==========================
// 7. CHECKOUT PAGE
// ==========================
const checkoutForm = document.getElementById("checkout-form");

function getOrder() {
    const lines = [];
    let subtotal = 0;
    let html = "";

    getCart().forEach(function (item) {
        const p = products.find(function (x) {
            return x.id === item.id;
        });
        if (!p) return;

        const lineTotal = p.price * item.qty;
        subtotal += lineTotal;
        lines.push(item.qty + " x " + p.name + " = SAR " + lineTotal);
        html += '<div class="summary-row"><span>' + p.name + " x " + item.qty +
                "</span><span>SAR " + lineTotal + "</span></div>";
    });

    return { lines: lines, subtotal: subtotal, html: html };
}

function renderCheckout() {
    if (!checkoutForm) return;

    const order = getOrder();
    const total = order.subtotal + DELIVERY_FEE;
    const status = document.getElementById("form-status");

    if (order.lines.length === 0) {
        document.getElementById("order-items").innerHTML =
            '<p class="summary-note">Your cart is empty. <a href="shop.html" class="back-link">Go to shop</a></p>';
        document.getElementById("place-order").disabled = true;
        status.textContent = "Add products to your cart first.";
    } else {
        document.getElementById("order-items").innerHTML = order.html;
    }

    document.getElementById("co-delivery").textContent =
        DELIVERY_FEE === 0 ? "Free" : "SAR " + DELIVERY_FEE;
    document.getElementById("co-total").textContent = "SAR " + total;
}

if (checkoutForm) {
    checkoutForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const order = getOrder();
        const status = document.getElementById("form-status");
        const button = document.getElementById("place-order");

        if (order.lines.length === 0) {
            status.textContent = "Your cart is empty.";
            return;
        }

        const data = new FormData(checkoutForm);
        data.set("order", order.lines.join("\n"));
        data.set("total", "SAR " + (order.subtotal + DELIVERY_FEE));

        button.disabled = true;
        button.textContent = "Sending...";
        status.textContent = "";

        try {
            const response = await fetch(checkoutForm.action, {
                method: "POST",
                body: data,
                headers: { Accept: "application/json" }
            });

            if (response.ok) {
                saveCart([]);
                updateCartCount();
                window.location.href = "thanks.html";
            } else {
                throw new Error("Server error");
            }
        } catch (err) {
            status.textContent = "Sorry, the order could not be sent. Please try again or order on WhatsApp.";
            button.disabled = false;
            button.textContent = "Place Order";
        }
    });
}


// ==========================
// PRODUCT DETAIL PAGE
// ==========================
const productPage = document.getElementById("product-page");
const categoryNames = { cream: "Creams", scrub: "Scrubs", hair: "Hair Care" };
let detailQty = 1;

function renderProductPage() {
    if (!productPage) return;

    const id = Number(params.get("id"));
    const p = products.find(function (x) {
        return x.id === id;
    });

    if (!p) {
        productPage.innerHTML = `
        <div class="empty-cart">
            <div class="empty-icon">🔍</div>
            <h3>Product not found</h3>
            <p>This product is not available.</p>
            <a href="shop.html" class="btn">Back to Shop</a>
        </div>`;
        return;
    }

    document.title = p.name + " | Beautiful Face";

    const crumb = document.getElementById("crumb-name");
    if (crumb) crumb.textContent = p.name;

    const discount = getDiscount(p);
    let badge = "";
    let oldPriceHtml = "";

    if (discount > 0) {
        badge = '<span class="badge">-' + discount + "%</span>";
        oldPriceHtml = '<del class="old-price">SAR ' + p.oldPrice + "</del>" +
                       '<span class="save-text">You save SAR ' + (p.oldPrice - p.price) + "</span>";
    }

    const desc = p.description || "A skin care product from Beautiful Face.";
    const askText = "Hello, I have a question about " + p.name;

    productPage.innerHTML = `
    <div class="detail-grid">

        <div class="detail-image">
            ${badge}
            <img src="${p.image}" alt="${p.name}">
        </div>

        <div class="detail-info">
            <p class="detail-category">${categoryNames[p.category] || ""}</p>
            <h1>${p.name}</h1>

            <div class="rating">
                <span class="stars">${makeStars(p.rating)}</span>
                <span class="review-count">(${p.reviews} reviews)</span>
            </div>

            <div class="detail-price">
                <span class="price">SAR ${p.price}</span>
                ${oldPriceHtml}
            </div>

            <p class="detail-desc">${desc}</p>

            <ul class="detail-points">
                <li>✅ Original product</li>
                <li>🚚 On time Delivery in Riyadh</li>
                <li>💵 Cash on Delivery available</li>
            </ul>

            <div class="detail-buy">
                <div class="qty">
                    <button type="button" data-detail="minus" aria-label="Decrease">-</button>
                    <span id="detail-qty">1</span>
                    <button type="button" data-detail="plus" aria-label="Increase">+</button>
                </div>
                <button type="button" id="detail-add" class="btn" data-id="${p.id}">Add to Cart</button>
            </div>

            <a class="btn btn-whatsapp btn-full" target="_blank" rel="noopener"
               href="https://wa.me/966576756048?text=${encodeURIComponent(askText)}">
                💬 Ask about this product
            </a>

            <a class="btn btn-outline btn-full" target="_blank" rel="noopener"
               href="https://wa.me/?text=${encodeURIComponent(p.name + ' - ' + window.location.href)}">
                Share
            </a>

        </div>

    </div>`;

    // Milte julte products
    const relatedBox = document.getElementById("related-list");
    const relatedSection = document.getElementById("related-section");

    if (relatedBox) {
        const related = products
            .filter(function (x) {
                return x.category === p.category && x.id !== p.id;
            })
            .slice(0, 4);

        if (related.length === 0) {
            relatedSection.hidden = true;
        } else {
            let html = "";
            related.forEach(function (r) {
                html += makeCard(r);
            });
            relatedBox.innerHTML = html;
        }
    }
}

// Quantity ke buttons (- aur +)
document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-detail]");
    if (!btn) return;

    if (btn.dataset.detail === "plus") detailQty++;
    if (btn.dataset.detail === "minus" && detailQty > 1) detailQty--;

    document.getElementById("detail-qty").textContent = detailQty;
});

// Add to Cart (chuni hui quantity ke saath)
document.addEventListener("click", function (e) {
    const btn = e.target.closest("#detail-add");
    if (!btn) return;

    for (let i = 0; i < detailQty; i++) {
        addToCart(Number(btn.dataset.id));
    }

    btn.textContent = "Added ✓";
    setTimeout(function () {
        btn.textContent = "Add to Cart";
    }, 1200);
});


// ==========================
// 8.  OPENING PAGE FOR
// ==========================
updateCartCount();
renderProducts();
renderCart();
renderCheckout();
renderProductPage();