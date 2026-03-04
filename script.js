let cart = JSON.parse(localStorage.getItem('chickFilACart')) || [];

function updateCartCount() {
    let totalQty = 0;
    cart.forEach(item => totalQty += item.qty);
    
    const cartBtn = document.querySelector('.navbar .order-now-btn');
    if (cartBtn) cartBtn.innerText = `Cart (${totalQty})`;

    // I-target ang mga buttons at input
    const finishBtn = document.getElementById("finishOrderBtn");
    const clearBtn = document.getElementById("clearCartBtn");
    const ageInput = document.getElementById("age"); 
    
    if (cart.length === 0) {
        // I-disable at hayaan ang CSS na mag-apply ng gray style
        if(finishBtn) finishBtn.disabled = true;
        if(clearBtn) clearBtn.disabled = true;
        if(ageInput) ageInput.disabled = true;
    } else {
        // I-enable kapag may laman na
        if(finishBtn) finishBtn.disabled = false;
        if(clearBtn) clearBtn.disabled = false;
        if(ageInput) ageInput.disabled = false;
    }
}

// --- BAGO: TOAST NOTIFICATION SYSTEM --- //
function showToast(message, type = 'success') {
    let toast = document.getElementById("toast-container");
    // Kung walang toast element, gagawa ang JS nang kusa (para di ka na mag-edit ng HTML)
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-container";
        document.body.appendChild(toast);
    }
    toast.className = `show toast-${type}`;
    toast.innerHTML = message;
    
    // Mawawala mag-isa after 3 seconds
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

// --- BAGO: DYNAMIC CONFIRMATION MODAL --- //
let pendingAction = null; // Mag-iimbak kung anong klaseng aksyon ang gagawin

function openConfirmModal(title, message, confirmBtnText, actionType, data = null) {
    document.querySelector("#confirmModal h3").innerText = title;
    document.getElementById("confirmMessage").innerHTML = message;
    
    // Palitan ang text ng confirm button (Yes Add / Yes Pay / Yes Clear)
    document.querySelector("#confirmModal .order-now-btn").innerText = confirmBtnText;
    
    pendingAction = { type: actionType, data: data };
    document.getElementById("confirmModal").style.display = "flex";
}

function closeConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
    pendingAction = null;
}

function confirmAction() {
    if (!pendingAction) return;

    // KUNG ANG AKSYON AY ADD TO CART
    if (pendingAction.type === 'add') {
        let { name, price, qty, id } = pendingAction.data;
        let existingItemIndex = cart.findIndex(item => item.name === name);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].qty += qty;
            cart[existingItemIndex].total = cart[existingItemIndex].qty * price;
        } else {
            cart.push({ name, price, qty, total: price * qty });
        }
        localStorage.setItem('chickFilACart', JSON.stringify(cart));
        updateCartCount();
        document.getElementById(id).value = 0;
        
        showToast(`<b>${qty}x ${name}</b> added to cart!`, "success");

    // KUNG ANG AKSYON AY CLEAR CART
    } else if (pendingAction.type === 'clear') {
        localStorage.removeItem('chickFilACart');
        cart = []; 
        updateCartCount(); 
        
        let ageInput = document.getElementById("age");
        if (ageInput) ageInput.value = "";
        
        openCartModal(); // I-refresh ang cart display
        showToast("Cart has been emptied.", "warning");

    // KUNG ANG AKSYON AY PAY/CHECKOUT
    } else if (pendingAction.type === 'pay') {
        let finalAmount = document.getElementById("finalTotal").innerText;
        localStorage.removeItem('chickFilACart');
        cart = [];
        updateCartCount();
        closeCartModal(); // Isara ang cart
        
        showToast(`Payment of <b>$${finalAmount}</b> successful!`, "success");
    }

    closeConfirmModal();
}

// --- IN-UPDATE NA TRIGGER FUNCTIONS --- //
function addToCart(name, price, id) {
    let qty = Number(document.getElementById(id).value);
    if (qty > 0) {
        // Tatawagin yung dynamic modal
        openConfirmModal("Confirm Order", `Add <b>${qty}x ${name}</b> to your cart?`, "Yes, Add", "add", { name, price, qty, id });
    } else {
        showToast("Lagay ka muna ng quantity!", "warning"); 
    }
}

function payNow() {
    if (cart.length === 0) {
        showToast("Your cart is empty!", "warning");
        return;
    }
    let finalAmount = document.getElementById("finalTotal").innerText;
    openConfirmModal("Confirm Payment", `Proceed to pay the amount of <b>$${finalAmount}</b>?`, "Yes, Pay", "pay");
}

function clearCart() {
    if (cart.length === 0) return; // Wag na mag pop-up kung empty na
    openConfirmModal("Clear Cart", "Are you sure you want to remove all items?", "Yes, Clear", "clear");
}

// --- CART MODAL UI FUNCTIONS --- //
function finishOrder() {
    let subtotal = 0;
    cart.forEach(item => subtotal += item.total);

    let ageInput = document.getElementById("age");
    let age = ageInput ? Number(ageInput.value) : 0; 
    let discount = (age >= 60) ? subtotal * 0.12 : 0;
    let finalTotal = subtotal - discount;

    let origTotalElem = document.getElementById("origTotal");
    let discountElem = document.getElementById("discount");
    let finalTotalElem = document.getElementById("finalTotal");

    if (origTotalElem) origTotalElem.innerText = subtotal.toFixed(2);
    if (discountElem) discountElem.innerText = discount.toFixed(2);
    if (finalTotalElem) finalTotalElem.innerText = finalTotal.toFixed(2);
}

function openCartModal() {
    const modal = document.getElementById("cartModal");
    const cartList = document.getElementById("cartItemsList");
    
    cartList.innerHTML = "";
    
    if (cart.length === 0) {
        cartList.innerHTML = "<p style='text-align:center; color:gray; font-style:italic; margin: 30px 0;'>Your cart is currently empty.</p>";
    } else {
        cart.forEach((item, index) => {
            cartList.innerHTML += `
                <div class="cart-item-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <span><b>${item.qty}x</b> ${item.name}</span>
                    <span>$${item.total.toFixed(2)}</span>
                    <button class="remove-item-btn" style="color: red; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 1.2rem;" onclick="removeItem(${index})" title="Remove Item">&times;</button>
                </div>
            `;
        });
    }
    
    finishOrder(); 
    modal.style.display = "flex";
}

function closeCartModal() {
    document.getElementById("cartModal").style.display = "none";
}

function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('chickFilACart', JSON.stringify(cart));
    updateCartCount(); 
    openCartModal(); 
    showToast("Item removed from cart", "warning");
}