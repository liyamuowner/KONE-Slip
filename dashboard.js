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

const recordsList = document.getElementById('records-list');
const loading = document.getElementById('loading');
const table = document.getElementById('records-table');
const searchInput = document.getElementById('search-input');

let allSlips = [];

async function fetchRecords() {
    try {
        const q = query(collection(db, "slips"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allSlips = [];
        querySnapshot.forEach(doc => {
            allSlips.push({ id: doc.id, ...doc.data() });
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
        
        tr.innerHTML = `
            <td class="mono-text">${new Date(slip.createdAt).toLocaleDateString()}</td>
            <td class="mono-text" style="color: var(--accent-color); font-weight: 600;">${slip.slipId}</td>
            <td>
                <div style="font-weight: 500;">${slip.clientName}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${slip.billToAddress.split('\n').slice(1).join(', ')}</div>
            </td>
            <td class="mono-text">Rs.${slip.total.toLocaleString()}</td>
            <td><span class="status-badge ${statusClass}">${slip.status}</span></td>
            <td>
                <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;" onclick="alert('View Detail coming soon!')">Details</button>
            </td>
        `;
        recordsList.appendChild(tr);
    });
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allSlips.filter(slip => 
        slip.clientName.toLowerCase().includes(term) || 
        slip.slipId.toLowerCase().includes(term)
    );
    renderRecords(filtered);
});

// Initial fetch
fetchRecords();
