// Kunin ang dati nang laman ng cart o gumawa ng bagong listahan
let cart = JSON.parse(localStorage.getItem('chickFilACart')) || [];

// Function para i-update ang bilang sa Cart button sa navbar
function updateCartCount() {
    let totalQty = 0;
    cart.forEach(item => {
        totalQty += item.qty;
    });
    
    // Hanapin yung button sa navbar
    const cartBtn = document.querySelector('.order-now-btn');
    if (cartBtn) {
        cartBtn.innerText = `Cart (${totalQty})`;
    }
}

// Patakbuhin agad pagka-load ng page para updated ang button
updateCartCount();

// --- TEMPORARY STORAGE PARA SA CONFIRMATION MODAL --- //
let pendingItem = null;

// --- BAGONG ADD TO CART (Walang alert, may Modal na) --- //
function addToCart(name, price, id) {
    let qty = Number(document.getElementById(id).value);

    if (qty > 0) {
        // I-save muna pansamantala
        pendingItem = { name: name, price: price, qty: qty, id: id };

        // Palitan ang text sa loob ng modal
        document.getElementById("confirmMessage").innerHTML = `Add <b>${qty}x ${name}</b> to your cart?`;

        // I-pop up ang confirmation modal
        document.getElementById("confirmModal").style.display = "flex";
    } else {
        alert("Lagay ka muna ng quantity!"); 
    }
}

// Isara yung confirm modal (kapag "No")
function closeConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
    pendingItem = null;
}

// Kapag pinindot ang "Yes" sa Confirm Modal
function confirmAction() {
    if (pendingItem) {
        let name = pendingItem.name;
        let price = pendingItem.price;
        let qty = pendingItem.qty;
        let id = pendingItem.id;

        let existingItemIndex = cart.findIndex(item => item.name === name);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].qty += qty;
            cart[existingItemIndex].total = cart[existingItemIndex].qty * price;
        } else {
            cart.push({
                name: name,
                price: price,
                qty: qty,
                total: price * qty
            });
        }

        // I-save sa localStorage at i-update UI
        localStorage.setItem('chickFilACart', JSON.stringify(cart));
        updateCartCount();

        // I-reset yung input box
        document.getElementById(id).value = 0;

        // Isara ang modal
        closeConfirmModal();
    }
}

function finishOrder() {
    let subtotal = 0;
    
    // Kunin lahat ng in-add sa cart
    cart.forEach(item => {
        subtotal += item.total;
    });

    let ageInput = document.getElementById("age");
    // I-check kung nag-eexist yung input bago kunin ang value (para iwas error)
    let age = ageInput ? Number(ageInput.value) : 0; 
    
    let discount = (age >= 60) ? subtotal * 0.12 : 0;
    let finalTotal = subtotal - discount;

    // I-display ang resulta sa loob ng Cart Modal
    let origTotalElem = document.getElementById("origTotal");
    let discountElem = document.getElementById("discount");
    let finalTotalElem = document.getElementById("finalTotal");

    if (origTotalElem) origTotalElem.innerText = subtotal.toFixed(2);
    if (discountElem) discountElem.innerText = discount.toFixed(2);
    if (finalTotalElem) finalTotalElem.innerText = finalTotal.toFixed(2);
}

// Para malinis ang cart
function clearCart() {
    localStorage.removeItem('chickFilACart');
    cart = []; 
    updateCartCount(); 
    
    let origTotalElem = document.getElementById("origTotal");
    let discountElem = document.getElementById("discount");
    let finalTotalElem = document.getElementById("finalTotal");
    let ageInput = document.getElementById("age");

    if (origTotalElem) origTotalElem.innerText = "0.00";
    if (discountElem) discountElem.innerText = "0.00";
    if (finalTotalElem) finalTotalElem.innerText = "0.00";
    if (ageInput) ageInput.value = "";
    
    // I-refresh yung laman ng cart modal kung nakabukas ito
    openCartModal();
}

// --- BAGONG PAY NOW FUNCTION --- //
function payNow() {
    if (cart.length === 0) {
        alert("Your cart is empty! Mag-add ka muna ng pagkain.");
        return;
    }
    
    let finalAmount = document.getElementById("finalTotal").innerText;
    alert(`Payment successful! You paid $${finalAmount}. Thank you!`);
    
    localStorage.removeItem('chickFilACart');
    cart = [];
    updateCartCount();
    closeCartModal();
}

// --- CART MODAL FUNCTIONS --- //
function openCartModal() {
    const modal = document.getElementById("cartModal");
    const cartList = document.getElementById("cartItemsList");
    
    cartList.innerHTML = "";
    
    if (cart.length === 0) {
        cartList.innerHTML = "<p style='text-align:center; color:gray; font-style:italic;'>Your cart is currently empty.</p>";
    } else {
        cart.forEach((item, index) => {
            cartList.innerHTML += `
                <div class="cart-item-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <span><b>${item.qty}x</b> ${item.name}</span>
                    <span>$${item.total.toFixed(2)}</span>
                    <button class="remove-item-btn" style="color: red; border: none; background: none; cursor: pointer; font-weight: bold;" onclick="removeItem(${index})" title="Remove Item">&times;</button>
                </div>
            `;
        });
    }
    
    // Auto-compute pagka-open ng cart
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
}