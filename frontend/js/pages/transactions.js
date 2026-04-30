/* =====================
   Transactions Page
   ===================== */

let txState = {
  transactions: [],
  categories: [],
  year: 0,
  month: 0,
  filterType: 'all',
  filterCategory: 'all',
};

function initTransactions() {
  const { year, month } = getCurrentMonth();
  txState.year = year;
  txState.month = month;
  txState.filterType = 'all';
  txState.filterCategory = 'all';

  document.getElementById('add-transaction-btn')
    ?.addEventListener('click', () => openTransactionModal());

  document.getElementById('filter-type')
    ?.addEventListener('change', (e) => {
      txState.filterType = e.target.value;
      renderTransactions();
    });

  document.getElementById('filter-category')
    ?.addEventListener('change', (e) => {
      txState.filterCategory = e.target.value;
      renderTransactions();
    });

  loadTransactions(year, month);
}

async function loadTransactions(year, month) {
  txState.year = year;
  txState.month = month;

  // Month selector
  const selectorEl = document.getElementById('tx-month-selector');
  if (selectorEl) {
    selectorEl.innerHTML = '';
    selectorEl.appendChild(renderMonthSelector(year, month, loadTransactions));
  }

  try {
    [txState.transactions, txState.categories] = await Promise.all([
      api.get('/transactions'),
      api.get('/categories'),
    ]);
  } catch (e) {
    txState.transactions = [];
    txState.categories = [];
  }

  if (!Array.isArray(txState.transactions)) txState.transactions = [];
  if (!Array.isArray(txState.categories)) txState.categories = [];

  // Populate category filter
  const catSelect = document.getElementById('filter-category');
  if (catSelect) {
    const current = catSelect.value;
    catSelect.innerHTML = '<option value="all">All categories</option>' +
      txState.categories.map(c =>
        `<option value="${c.id}">${c.name}</option>`
      ).join('');
    catSelect.value = current;
  }

  renderTransactions();
}

function getFilteredTransactions() {
  const { start, end } = getMonthRange(txState.year, txState.month);

  return txState.transactions.filter(t => {
    if (t.date < start || t.date > end) return false;
    if (txState.filterType !== 'all' && t.type !== txState.filterType) return false;
    if (txState.filterCategory !== 'all' && t.category !== txState.filterCategory) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));
}

function renderTransactions() {
  const contentEl = document.getElementById('transactions-content');
  if (!contentEl) return;

  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    contentEl.innerHTML = renderEmptyState('No transactions found for this period');
    return;
  }

  const catMap = {};
  txState.categories.forEach(c => { catMap[c.id] = c; });

  contentEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(t => {
            const cat = catMap[t.category];
            const isIncome = t.type === 'income';
            return `
              <tr>
                <td>${formatDate(t.date)}</td>
                <td>${t.description || '—'}</td>
                <td>${cat ? renderCategoryBadge(cat.name, cat.color) : '—'}</td>
                <td class="${isIncome ? 'amount-income' : 'amount-expense'}">
                  ${isIncome ? '+' : '-'}${formatCurrency(Math.abs(t.amount))}
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" data-edit-tx="${t.id}" aria-label="Edit">&#9998;</button>
                    <button class="btn-icon" data-delete-tx="${t.id}" aria-label="Delete">&#10005;</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Wire edit
  contentEl.querySelectorAll('[data-edit-tx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = txState.transactions.find(tx => tx.id === btn.dataset.editTx);
      if (t) openTransactionModal(t);
    });
  });

  // Wire delete
  contentEl.querySelectorAll('[data-delete-tx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = txState.transactions.find(tx => tx.id === btn.dataset.deleteTx);
      openConfirmModal(
        'Delete Transaction',
        `Delete "${t?.description || 'this transaction'}"?`,
        async () => {
          try {
            await api.delete(`/transactions/${btn.dataset.deleteTx}`);
            showToast('Transaction deleted');
            loadTransactions(txState.year, txState.month);
          } catch (e) {
            showToast('Failed to delete', 'error');
          }
        }
      );
    });
  });
}

function openTransactionModal(existing) {
  const isEdit = !!existing;
  const title = isEdit ? 'Edit Transaction' : 'New Transaction';

  const catOptions = txState.categories.map(c =>
    `<option value="${c.id}" ${existing?.category === c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  const bodyHTML = `
    <div class="form-row">
      <label for="tx-desc">Description</label>
      <input type="text" id="tx-desc" placeholder="What was this for?" value="${existing?.description || ''}" />
    </div>
    <div class="form-row-inline">
      <div>
        <label for="tx-amount">Amount</label>
        <input type="number" id="tx-amount" placeholder="0.00" step="0.01" min="0" value="${existing?.amount || ''}" />
      </div>
      <div>
        <label for="tx-date">Date</label>
        <input type="date" id="tx-date" value="${existing?.date || todayString()}" />
      </div>
    </div>
    <div class="form-row">
      <label for="tx-category">Category</label>
      <select id="tx-category">
        <option value="">No category</option>
        ${catOptions}
      </select>
    </div>
    <div class="form-row">
      <label>Type</label>
      <div class="type-toggle">
        <input type="radio" name="tx-type" id="tx-type-expense" value="expense" ${(!existing || existing.type === 'expense') ? 'checked' : ''} />
        <label for="tx-type-expense">Expense</label>
        <input type="radio" name="tx-type" id="tx-type-income" value="income" ${existing?.type === 'income' ? 'checked' : ''} />
        <label for="tx-type-income">Income</label>
      </div>
    </div>
  `;

  openModal(title, bodyHTML, async (close) => {
    const description = document.getElementById('tx-desc').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const date = document.getElementById('tx-date').value;
    const category = document.getElementById('tx-category').value || null;
    const type = document.querySelector('input[name="tx-type"]:checked')?.value || 'expense';

    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (!date) {
      showToast('Date is required', 'error');
      return;
    }

    const body = { description, amount, date, category, type };

    try {
      if (isEdit) {
        await api.put(`/transactions/${existing.id}`, body);
        showToast('Transaction updated');
      } else {
        await api.post('/transactions', body);
        showToast('Transaction created');
      }
      close();
      loadTransactions(txState.year, txState.month);
    } catch (e) {
      showToast('Failed to save', 'error');
    }
  });
}
