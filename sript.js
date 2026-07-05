/* Expense Tracker Script */

// Storage key
const STORAGE_KEY = 'et_transactions_v1';

// Elements
const txForm = document.getElementById('txForm');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const dateInput = document.getElementById('date');
const txList = document.getElementById('txList');
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEdit');
const searchInput = document.getElementById('search');
const clearAllBtn = document.getElementById('clearAll');

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editId = null; // when editing, stores id

// Initialize default date to today
dateInput.value = new Date().toISOString().slice(0,10);

// Initialize chart
let chart = null;
function createChart(income, expense) {
  const ctx = document.getElementById('summaryChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: {
          label: function(ctx) {
            const label = ctx.label || '';
            const value = ctx.raw || 0;
            return label + ': ₹' + value.toFixed(2);
          }
        }}
      }
    }
  });
}

// Utility - format currency
function formatCurrency(n){
  return '₹' + Number(n).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}

// Save to localStorage
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Render transactions and totals
function render(filterText = '') {
  // filter
  const list = (filterText.trim() === '') 
    ? transactions 
    : transactions.filter(t => (t.title + t.type + t.date).toLowerCase().includes(filterText.toLowerCase()));

  txList.innerHTML = '';
  if (list.length === 0) {
    txList.innerHTML = `<li class="note" style="text-align:center;color:${getComputedStyle(document.documentElement).getPropertyValue('--muted') || '#666'}">No transactions yet</li>`;
  } else {
    list.forEach(t => {
      const li = document.createElement('li');
      li.className = 'note';
      li.innerHTML = `
        <div class="actions">
          <button class="icon-btn" onclick="startEdit('${t.id}')" title="Edit">✏️</button>
          <button class="icon-btn" onclick="removeTx('${t.id}')" title="Delete">🗑️</button>
        </div>

        <h4>${escapeHtml(t.title)}</h4>
        <p class="muted">${t.date}</p>

        <div class="meta">
          <div class="badge ${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</div>
          <div style="font-weight:700">${formatCurrency(t.amount)}</div>
        </div>
      `;
      txList.appendChild(li);
    });
  }

  // totals
  const incomeTotal = transactions.filter(t => t.type==='income').reduce((s, t) => s + Number(t.amount), 0);
  const expenseTotal = transactions.filter(t => t.type==='expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = incomeTotal - expenseTotal;

  incomeEl.textContent = formatCurrency(incomeTotal);
  expenseEl.textContent = formatCurrency(expenseTotal);
  balanceEl.textContent = formatCurrency(balance);

  // update chart
  createChart(incomeTotal, expenseTotal);
}

// Escape HTML (safety)
function escapeHtml(str){
  return String(str).replace(/[&<>"'`]/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'})[m]; });
}

// add or update transaction
txForm.addEventListener('submit', function(e){
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeSelect.value;
  const date = dateInput.value || new Date().toISOString().slice(0,10);

  if (!title || !amount || isNaN(amount)) {
    alert('Please provide valid title and amount');
    return;
  }

  if (editId) {
    // update existing
    const idx = transactions.findIndex(t => t.id === editId);
    if (idx > -1) {
      transactions[idx].title = title;
      transactions[idx].amount = Number(amount);
      transactions[idx].type = type;
      transactions[idx].date = date;
    }
    editId = null;
    submitBtn.textContent = 'Add Transaction';
    cancelEditBtn.classList.add('hidden');
  } else {
    // new
    const tx = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      title,
      amount: Number(amount),
      type,
      date
    };
    transactions.unshift(tx); // newest first
  }

  save();
  render(searchInput.value);
  txForm.reset();
  dateInput.value = new Date().toISOString().slice(0,10);
});

// Remove tx
function removeTx(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  save();
  render(searchInput.value);
}

// Start edit
function startEdit(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  titleInput.value = tx.title;
  amountInput.value = tx.amount;
  typeSelect.value = tx.type;
  dateInput.value = tx.date;
  editId = id;
  submitBtn.textContent = 'Update Transaction';
  cancelEditBtn.classList.remove('hidden');
  // scroll into view
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cancel edit
cancelEditBtn.addEventListener('click', function(){
  editId = null;
  txForm.reset();
  submitBtn.textContent = 'Add Transaction';
  cancelEditBtn.classList.add('hidden');
  dateInput.value = new Date().toISOString().slice(0,10);
});

// Search
searchInput.addEventListener('input', function(){
  render(this.value);
});

// Clear all
clearAllBtn.addEventListener('click', function(){
  if (!confirm('Clear all transactions? This cannot be undone.')) return;
  transactions = [];
  save();
  render('');
});

// Initial render
render();
