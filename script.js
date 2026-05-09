// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyXpCdAKnWRthhZeU-QCU1arAUI9_1FCY",
  authDomain: "kone-slip.firebaseapp.com",
  projectId: "kone-slip",
  storageBucket: "kone-slip.firebasestorage.app",
  messagingSenderId: "1035126271733",
  appId: "1:1035126271733:web:784d132a88b53f4c13dfbc",
  measurementId: "G-HK50W0M9VP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const slipId = document.getElementById('slip-id');
    const slipDate = document.getElementById('slip-date');
    const orderDate = document.getElementById('order-date');
    const delDate = document.getElementById('delivered-date');
    const billTo = document.getElementById('bill-to');
    const paymentStatus = document.getElementById('payment-status');
    const notes = document.getElementById('notes');
    const addItemBtn = document.getElementById('add-item');
    const downloadBtn = document.getElementById('download-btn');
    const itemsList = document.getElementById('items-list');

    // Previews
    const rubberStamp = document.getElementById('rubber-stamp');
    const prevSlipId = document.getElementById('prev-slip-id');
    const prevSlipDate = document.getElementById('prev-slip-date');
    const prevPkgId = document.getElementById('prev-pkg-id');
    const prevOrderDate = document.getElementById('prev-order-date');
    const prevDelDate = document.getElementById('prev-del-date');
    const prevBillTo = document.getElementById('prev-bill-to');
    const prevItems = document.getElementById('prev-items');
    const prevTotalQty = document.getElementById('prev-total-qty');
    const prevTotalPrice = document.getElementById('prev-total-price');
    const prevFinalPrice = document.getElementById('prev-final-price');
    const prevNotes = document.getElementById('prev-notes');
    const prevThankName = document.getElementById('prev-thank-name');

    // Simple Updates
    const updateText = (input, preview, fallback = '') => {
        input.addEventListener('input', () => {
            preview.innerHTML = input.value ? input.value.replace(/\n/g, '<br>') : fallback;
            if (input === billTo) {
                // Also update the thank you name (first line of bill to)
                const name = input.value.split('\n')[0] || '';
                prevThankName.textContent = name;
            }
            if (input === slipId) {
                prevPkgId.innerHTML = input.value || '{Package id}';
            }
        });
        // Initial setup
        preview.innerHTML = input.value ? input.value.replace(/\n/g, '<br>') : fallback;
        if (input === billTo) {
            const name = input.value.split('\n')[0] || '';
            prevThankName.textContent = name;
        }
        if (input === slipId) {
            prevPkgId.innerHTML = input.value || '{Package id}';
        }
    };

    updateText(slipId, prevSlipId, '{slip-ID}');
    updateText(slipDate, prevSlipDate, '{slip-date}');
    updateText(orderDate, prevOrderDate, '{Order Date}');
    updateText(delDate, prevDelDate, '{Delevered date}');
    updateText(billTo, prevBillTo, '{name of customer}<br>{address}');
    updateText(notes, prevNotes, '{text box}');

    // Items Logic
    const discountInput = document.getElementById('discount-input');
    const prevSubtotal = document.getElementById('prev-subtotal');
    const prevDiscount = document.getElementById('prev-discount');
    const discountContainer = document.getElementById('discount-container');

    function updateTotals() {
        let totalQty = 0;
        let subtotalPrice = 0;
        const rows = itemsList.querySelectorAll('.item-row');
        prevItems.innerHTML = '';

        rows.forEach(row => {
            const desc = row.querySelector('.item-desc').value || '{item name}';
            const type = row.querySelector('.item-type').value || '{PNG/JPG}';
            const qtyStr = row.querySelector('.item-qty').value;
            const priceStr = row.querySelector('.item-price').value;

            const qty = parseFloat(qtyStr) || 0;
            const price = parseFloat(priceStr) || 0;

            totalQty += qty;
            subtotalPrice += price;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${desc}</td>
                <td>${type}</td>
                <td>${qtyStr || '{quntity}'}</td>
                <td>${priceStr ? price.toFixed(2) : '{price}'}</td>
            `;
            prevItems.appendChild(tr);
        });

        // Get discount
        let discount = parseFloat(discountInput.value) || 0;
        if (discount < 0) discount = 0;

        let finalPrice = subtotalPrice - discount;
        if (finalPrice < 0) finalPrice = 0;

        // Update UI
        prevTotalQty.textContent = totalQty > 0 ? totalQty : '{qty}';

        // The table footer shows subtotal
        prevTotalPrice.textContent = subtotalPrice > 0 ? subtotalPrice.toFixed(2) : '{price}';

        // Breakdown section
        prevSubtotal.textContent = subtotalPrice > 0 ? subtotalPrice.toFixed(2) : '{subtotal}';

        // Show/hide discount row based on value
        if (discount > 0) {
            discountContainer.style.display = 'block';
            prevDiscount.textContent = discount.toFixed(2);
        } else {
            discountContainer.style.display = 'none';
        }

        prevFinalPrice.textContent = subtotalPrice > 0 ? finalPrice.toFixed(2) : '{total price}';
    }

    discountInput.addEventListener('input', updateTotals);

    // Payment Status Logic
    paymentStatus.addEventListener('change', () => {
        if (paymentStatus.value === 'paid') {
            rubberStamp.className = 'rubber-stamp stamp-paid';
            rubberStamp.textContent = 'PAID';
            if (notes.value.includes('Please process payment within 14 days.')) {
                notes.value = '\nPayment received successfully! \nThank you for choosing <b>K1 BUILDS</b>.';
                prevNotes.innerHTML = notes.value.replace(/\n/g, '<br>');
            }
        } else {
            rubberStamp.className = 'rubber-stamp stamp-pending';
            rubberStamp.textContent = 'PAYMENT PENDING';
            if (notes.value.includes('Payment received with thanks.')) {
                notes.value = 'Please process payment within 14 days.';
                prevNotes.innerHTML = notes.value.replace(/\n/g, '<br>');
            }
        }
    });

    function createItemRow(desc = '', type = '', qty = '', price = '') {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
            <input type="text" list="item-options" class="item-desc" placeholder="Description" value="${desc}">
            <input type="text" list="type-options" class="item-type" placeholder="Type" value="${type}">
            <input type="number" class="item-qty" placeholder="Qty" value="${qty}">
            <input type="number" class="item-price" placeholder="Price" value="${price}">
            <button class="remove-item" title="Remove">×</button>
        `;

        div.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updateTotals);
        });

        div.querySelector('.remove-item').addEventListener('click', () => {
            div.remove();
            updateTotals();
        });

        return div;
    }

    addItemBtn.addEventListener('click', () => {
        itemsList.appendChild(createItemRow());
        updateTotals();
    });

    // Add exactly one empty row initially
    itemsList.appendChild(createItemRow('', '', '1', '0.00'));

    // Download PDF natively and save to Excel
    downloadBtn.addEventListener('click', async () => {
        const items = Array.from(itemsList.querySelectorAll('.item-row')).map(row => ({
            description: row.querySelector('.item-desc').value,
            type: row.querySelector('.item-type').value,
            qty: row.querySelector('.item-qty').value,
            price: row.querySelector('.item-price').value
        }));

        const slipData = {
            slipId: slipId.value,
            slipDate: slipDate.value,
            pkgId: slipId.value,
            orderDate: orderDate.value,
            delDate: delDate.value,
            clientName: billTo.value.split('\n')[0] || '',
            billToAddress: billTo.value,
            items: items,
            subtotal: parseFloat(prevSubtotal.textContent) || 0,
            discount: parseFloat(prevDiscount ? prevDiscount.textContent : 0) || 0,
            total: parseFloat(prevFinalPrice.textContent) || 0,
            status: paymentStatus.value,
            notes: notes.value
        };

        try {
            // Save to Firestore
            await addDoc(collection(db, "slips"), {
                ...slipData,
                createdAt: new Date().toISOString()
            });
            console.log("Slip saved to Firestore successfully.");
        } catch (error) {
            console.error("Error saving to Firestore:", error);
        }

        // Generate PDF natively (perfect CSS rendering)
        window.print();
    });

    // Fetch Next Slip ID from Firestore
    async function fetchNextSlipId() {
        try {
            const q = query(collection(db, "slips"), orderBy("createdAt", "desc"), limit(1));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const lastSlip = querySnapshot.docs[0].data();
                const lastId = lastSlip.slipId;
                
                if (lastId && lastId.includes('-')) {
                    const parts = lastId.split('-');
                    const numPart = parseInt(parts[parts.length - 1]);
                    if (!isNaN(numPart)) {
                        const nextNum = numPart + 1;
                        parts[parts.length - 1] = nextNum.toString().padStart(3, '0');
                        slipId.value = parts.join('-');
                        slipId.dispatchEvent(new Event('input'));
                        return;
                    }
                }
            }
            slipId.value = 'INV-2026-001';
            slipId.dispatchEvent(new Event('input'));
        } catch (error) {
            console.error("Could not fetch next Slip ID from Firestore:", error);
        }
    }

    // Fetch and populate previous customers
    const customerSelect = document.getElementById('customer-select');
    let customersData = [];

    async function fetchCustomers() {
        try {
            const querySnapshot = await getDocs(collection(db, "slips"));
            const customersMap = new Map();
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.clientName && data.billToAddress && !customersMap.has(data.clientName)) {
                    customersMap.set(data.clientName, data.billToAddress);
                }
            });

            customersData = Array.from(customersMap.entries()).map(([name, address]) => ({
                name, address
            }));

            customerSelect.innerHTML = '<option value="">-- Select Existing Customer --</option>';
            customersData.forEach(cust => {
                const option = document.createElement('option');
                option.value = cust.name;
                option.textContent = cust.name;
                customerSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Could not fetch customers from Firestore:", error);
        }
    }

    customerSelect.addEventListener('change', () => {
        const selectedName = customerSelect.value;
        if (selectedName) {
            const customer = customersData.find(c => c.name === selectedName);
            if (customer) {
                billTo.value = customer.address;
                billTo.dispatchEvent(new Event('input'));
            }
        } else {
            billTo.value = '';
            billTo.dispatchEvent(new Event('input'));
        }
    });

    // Initial update
    updateTotals();
    fetchNextSlipId();
    fetchCustomers();
});
