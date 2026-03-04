let cart = JSON.parse(localStorage.getItem('chickFilACart')) || [];

function updateCartCount() {
    let totalQty = 0;
    cart.forEach(item => totalQty += item.qty);
    
    const cartBtn = document.querySelector('.navbar .order-now-btn');
    if (cartBtn) cartBtn.innerText = `Cart (${totalQty})`;

    const finishBtn = document.getElementById("finishOrderBtn");
    const clearBtn = document.getElementById("clearCartBtn");
    const ageInput = document.getElementById("age"); 
    
    if (cart.length === 0) {
        if(ageInput) ageInput.disabled = true;
        // Itatago ang button kapag walang laman ang cart
        if(clearBtn) clearBtn.style.display = 'none'; 
    } else {
        if(ageInput) ageInput.disabled = false;
        // Ipapalabas ulit ang button kapag may laman na ang cart
        if(clearBtn) clearBtn.style.display = 'block'; 
    }
}

updateCartCount();

function showToast(message, type = 'success') {
    let toast = document.getElementById("toast-container");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-container";
        document.body.appendChild(toast);
    }
    toast.className = `show toast-${type}`;
    toast.innerHTML = message;
    
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

// --- BAGO: Para lumabas yung input ng Card/E-Wallet --- //
function togglePaymentDetails() {
    const method = document.getElementById("paymentMethod")?.value;
    const detailsDiv = document.getElementById("paymentDetails");
    const label = document.getElementById("paymentLabel");
    const input = document.getElementById("paymentNumber");

    if (!detailsDiv) return;

    if (method === "Card") {
        detailsDiv.style.display = "block";
        label.innerText = "Card Number:";
        input.placeholder = "Enter 16-digit card number...";
    } else if (method === "GCash/PayMaya") {
        detailsDiv.style.display = "block";
        label.innerText = "E-Wallet Number:";
        input.placeholder = "Enter mobile number...";
    } else {
        detailsDiv.style.display = "none";
        input.value = ""; // clear kung bumalik sa cash
    }
}

// --- MODALS --- //
let pendingAction = null;

function openConfirmModal(title, message, confirmBtnText, actionType, data = null) {
    document.querySelector("#confirmModal h3").innerText = title;
    document.getElementById("confirmMessage").innerHTML = message;
    document.querySelector("#confirmModal .order-now-btn").innerText = confirmBtnText;
    
    pendingAction = { type: actionType, data: data };
    document.getElementById("confirmModal").style.display = "flex";
}

function closeConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
    pendingAction = null;
}

// --- BAGO: Para isara yung Receipt --- //
function closeReceiptModal() {
    document.getElementById("receiptModal").style.display = "none";
}

function confirmAction() {
    if (!pendingAction) return;

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

    } else if (pendingAction.type === 'clear') {
        localStorage.removeItem('chickFilACart');
        cart = []; 
        updateCartCount(); 
        
        let ageInput = document.getElementById("age");
        if (ageInput) ageInput.value = "";
        
        openCartModal(); 
        showToast("Cart has been emptied.", "warning");

    } else if (pendingAction.type === 'pay') {
        // Kukunin natin lahat ng data na kailangan sa resibo
        let finalAmount = document.getElementById("finalTotal").innerText;
        let subtotal = document.getElementById("origTotal").innerText;
        let discount = document.getElementById("discount").innerText;
        
        let address = document.getElementById("address").value;
        let notes = document.getElementById("specialNotes")?.value || "None";
        let paymentMethod = document.getElementById("paymentMethod").value;
        let paymentNumber = document.getElementById("paymentNumber")?.value || "N/A";
        
        let orderNumber = Math.floor(Math.random() * 90000) + 10000; 
        
        // --- BUUIN ANG RESIBO (HTML STRING) ---
        let receiptHTML = `
            <p style="margin: 5px 0;"><b>Order #:</b> ${orderNumber}</p>
            <p style="margin: 5px 0;"><b>Date:</b> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p style="margin: 5px 0;"><b>Address:</b> ${address}</p>
            <hr style="border: 1px dashed #ccc; margin: 15px 0;">
            <div style="margin-bottom: 10px;"><b>ITEMS:</b></div>
        `;

        cart.forEach(item => {
            receiptHTML += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${item.qty}x ${item.name}</span>
                    <span>$${item.total.toFixed(2)}</span>
                </div>
            `;
        });

        receiptHTML += `
            <hr style="border: 1px dashed #ccc; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Subtotal:</span><span>$${subtotal}</span></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #dd0031;"><span>Discount:</span><span>-$${discount}</span></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; font-size: 1.1rem;"><span>TOTAL:</span><span>$${finalAmount}</span></div>
            
            <p style="margin: 5px 0; font-size: 0.85rem;"><b>Method:</b> ${paymentMethod}</p>
            ${paymentMethod !== 'Cash' ? `<p style="margin: 5px 0; font-size: 0.85rem;"><b>Acc/Card No:</b> ****${paymentNumber.slice(-4)}</p>` : ''}
            <p style="margin: 5px 0; font-size: 0.85rem;"><b>Notes:</b> ${notes}</p>
        `;

        // Ilagay ang resibo sa modal at ipakita
        document.getElementById("receiptContent").innerHTML = receiptHTML;
        
        // I-clear ang system
        localStorage.removeItem('chickFilACart');
        cart = [];
        updateCartCount();
        closeCartModal(); 
        
        // I-reset ang mga fields
        document.getElementById("address").value = "";
        if(document.getElementById("specialNotes")) document.getElementById("specialNotes").value = "";
        if(document.getElementById("paymentNumber")) document.getElementById("paymentNumber").value = "";
        document.getElementById("paymentMethod").value = "Cash";
        togglePaymentDetails(); // I-hide ulit yung input para sa card

        // Ipakita yung resibo pop-up
        document.getElementById("receiptModal").style.display = "flex";
    }

    closeConfirmModal();
}

// --- TRIGGER FUNCTIONS --- //
function addToCart(name, price, id) {
    let qty = Number(document.getElementById(id).value);
    if (qty > 0) {
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

    // --- BAGO: Validation bago maka-checkout --- //
    let address = document.getElementById("address").value.trim();
    if (address === "") {
        showToast("Please enter your delivery address!", "warning");
        document.getElementById("address").focus();
        return;
    }

    let method = document.getElementById("paymentMethod").value;
    let paymentNum = document.getElementById("paymentNumber").value.trim();
    
    if (method !== "Cash" && paymentNum === "") {
        showToast("Please enter your account/card number!", "warning");
        document.getElementById("paymentNumber").focus();
        return;
    }

    let finalAmount = document.getElementById("finalTotal").innerText;
    openConfirmModal("Confirm Payment", `Proceed to pay <b>$${finalAmount}</b> via <b>${method}</b>?`, "Yes, Pay", "pay");
}

function clearCart() {
    if (cart.length === 0) return; 
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