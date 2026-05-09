import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);

const modal = document.getElementById('details-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');
const printModalBtn = document.getElementById('print-modal-btn');

const recordsList = document.getElementById('records-list');
const loading = document.getElementById('loading');
const table = document.getElementById('records-table');
const searchInput = document.getElementById('search-input');

let allSlips = [];
let currentSlip = null;

async function fetchRecords() {
    try {
        const q = query(collection(db, "slips"));
        const querySnapshot = await getDocs(q);
        
        allSlips = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            allSlips.push({ id: doc.id, ...data });
        });

        // Sort manually by createdAt if it exists, otherwise use orderDate or slipDate
        allSlips.sort((a, b) => {
            const dateA = a.createdAt || a.slipDate || '';
            const dateB = b.createdAt || b.slipDate || '';
            return dateB.localeCompare(dateA);
        });

        renderRecords(allSlips);
        loading.style.display = 'none';
        table.style.display = 'table';
    } catch (error) {
        console.error("Error fetching records:", error);
        loading.textContent = "Error loading records. Check console.";
    }
}

function renderRecords(slips) {
    recordsList.innerHTML = '';
    slips.forEach(slip => {
        const tr = document.createElement('tr');
        const statusClass = slip.status === 'paid' ? 'status-paid' : 'status-pending';
        
        const slipDateDisplay = slip.createdAt ? new Date(slip.createdAt).toLocaleDateString() : (slip.slipDate || 'No Date');
        tr.innerHTML = `
            <td class="mono-text">${slipDateDisplay}</td>
            <td class="mono-text" style="color: var(--primary); font-weight: 600;">${slip.slipId}</td>
            <td>
                <div style="font-weight: 500;">${slip.clientName}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${slip.billToAddress.split('\n').slice(1).join(', ')}</div>
            </td>
            <td class="mono-text">Rs.${slip.total.toLocaleString()}</td>
            <td><span class="status-badge ${statusClass}">${slip.status}</span></td>
            <td>
                <button class="btn-secondary detail-btn" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">Details</button>
            </td>
        `;
        
        tr.querySelector('.detail-btn').addEventListener('click', () => showDetails(slip));
        recordsList.appendChild(tr);
    });
}

function showDetails(slip) {
    currentSlip = slip;
    
    let itemsHtml = '';
    
    // Check if the new 'items' array exists and has content
    if (slip.items && slip.items.length > 0) {
        itemsHtml = slip.items.map(item => `
            <tr>
                <td>${item.description || '-'}</td>
                <td>${item.type || '-'}</td>
                <td>${item.qty || '1'}</td>
                <td>Rs.${parseFloat(item.price || 0).toLocaleString()}</td>
            </tr>
        `).join('');
    } 
    // Fallback: Check for legacy root-level fields (for old records)
    else if (slip.description || slip.price) {
        itemsHtml = `
            <tr>
                <td>${slip.description || 'General Service'}</td>
                <td>${slip.type || '-'}</td>
                <td>${slip.qty || '1'}</td>
                <td>Rs.${parseFloat(slip.price || 0).toLocaleString()}</td>
            </tr>
        `;
    } 
    else {
        itemsHtml = '<tr><td colspan="4" style="text-align:center">No items found</td></tr>';
    }

    modalBody.innerHTML = `
        <div class="modal-body-header">
            <div>
                <h2 style="color: var(--primary); margin-bottom: 0.3rem;">Slip Details</h2>
                <p class="mono-text" style="font-size: 0.9rem; color: var(--text-muted);">${slip.slipId}</p>
            </div>
            <div style="text-align: right">
                <span class="status-badge ${slip.status === 'paid' ? 'status-paid' : 'status-pending'}">${slip.status}</span>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">${new Date(slip.createdAt).toLocaleString()}</p>
            </div>
        </div>

        <div class="modal-detail-grid">
            <div class="detail-item">
                <label>Bill To</label>
                <p style="white-space: pre-line;">${slip.billToAddress}</p>
            </div>
            <div class="detail-item">
                <label>Dates</label>
                <p>Order: ${slip.orderDate}</p>
                <p>Delivery: ${slip.delDate}</p>
                <p>Slip: ${slip.slipDate}</p>
            </div>
        </div>

        <label style="display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; letter-spacing: 1px;">Items</label>
        <table class="modal-items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="modal-summary">
            <div class="summary-row">
                <span>Subtotal</span>
                <span class="mono-text">Rs.${slip.subtotal.toLocaleString()}</span>
            </div>
            <div class="summary-row" style="color: #ef4444;">
                <span>Discount</span>
                <span class="mono-text">- Rs.${slip.discount.toLocaleString()}</span>
            </div>
            <div class="summary-row total">
                <span>Total Amount</span>
                <span class="mono-text">Rs.${slip.total.toLocaleString()}</span>
            </div>
        </div>

        <div class="detail-item" style="margin-top: 2rem;">
            <label>Notes</label>
            <p style="color: var(--text-muted); font-style: italic;">"${slip.notes || 'No notes provided.'}"</p>
        </div>
    `;

    modal.style.display = 'block';
}

closeModal.onclick = () => modal.style.display = 'none';
window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

printModalBtn.onclick = () => {
    // Redirect to index.html with the slip ID or data to re-populate?
    // Or just alert for now.
    alert('Printing from dashboard will be implemented soon. For now, please use the "New Slip" page to generate PDFs.');
};

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allSlips.filter(slip => 
        slip.clientName.toLowerCase().includes(term) || 
        slip.slipId.toLowerCase().includes(term)
    );
    renderRecords(filtered);
});

fetchRecords();
