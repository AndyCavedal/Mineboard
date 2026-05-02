/* =====================
   Dashboard Page
   ===================== */

let dashboardChart = null;

function initDashboard() {
  const { year, month } = getCurrentMonth();
  loadDashboard(year, month);
}

async function loadDashboard(year, month) {
  // Month selector
  const selectorEl = document.getElementById('month-selector');
  if (selectorEl) {
    selectorEl.innerHTML = '';
    selectorEl.appendChild(renderMonthSelector(year, month, loadDashboard));
  }

  // Show cached data immediately (stale-while-revalidate)
  const cachedTx = api.getCached('/transactions');
  const cachedCats = api.getCached('/categories');

  if (cachedTx && cachedCats) {
    _renderDashboard(year, month, cachedTx, cachedCats);
  } else {
    // No cache yet — show skeletons
    const cardsEl = document.getElementById('summary-cards');
    if (cardsEl) {
      cardsEl.innerHTML = Array(3).fill(renderSummaryCardSkeleton()).join('');
    }
  }

  // Always fetch fresh
  try {
    const [transactions, categories] = await Promise.all([
      api.get('/transactions'),
      api.get('/categories'),
    ]);
    _renderDashboard(year, month, transactions, categories);
  } catch (e) {
    // Keep cached render if available; otherwise leave skeletons
  }
}

function _renderDashboard(year, month, transactions, categories) {
  if (!Array.isArray(transactions)) transactions = [];
  if (!Array.isArray(categories)) categories = [];

  // Filter by month
  const { start, end } = getMonthRange(year, month);
  const monthly = transactions.filter(t => {
    const d = typeof t.date === 'string' ? t.date.slice(0, 10) : '';
    return d >= start && d <= end;
  });

  // Calculate totals
  const income = monthly
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = monthly
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expenses;

  // Summary cards
  const cardsEl = document.getElementById('summary-cards');
  if (cardsEl) {
    cardsEl.innerHTML =
      renderSummaryCard('Income',   formatCurrency(income),   'var(--color-income)',  `${monthly.filter(t => t.type === 'income').length} transactions`,  'income') +
      renderSummaryCard('Expenses', formatCurrency(expenses), 'var(--color-expense)', `${monthly.filter(t => t.type === 'expense').length} transactions`, 'expense') +
      renderSummaryCard('Balance',  formatCurrency(balance),  balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)', `${monthly.length} total`);

    // Wire Income/Expense cards → navigate to Transactions with pre-set filter
    cardsEl.querySelectorAll('[data-tx-filter]').forEach(card => {
      card.addEventListener('click', () => {
        window.__txPreFilter = card.dataset.txFilter;
        location.hash = '#/transactions';
      });
    });
  }

  // Chart
  renderExpenseChart(monthly, categories);

  // Recent transactions
  renderRecentTransactions(monthly, categories);
}

function renderExpenseChart(transactions, categories) {
  const canvas = document.getElementById('category-chart');
  const emptyEl = document.getElementById('chart-empty');
  if (!canvas) return;

  // Destroy previous chart
  if (dashboardChart) {
    dashboardChart.destroy();
    dashboardChart = null;
  }

  const expensesByCategory = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const catId = t.category || 'uncategorized';
      expensesByCategory[catId] = (expensesByCategory[catId] || 0) + Number(t.amount);
    });

  const entries = Object.entries(expensesByCategory);

  if (entries.length === 0) {
    canvas.style.display = 'none';
    if (emptyEl) {
      emptyEl.style.display = '';
      emptyEl.innerHTML = renderEmptyState('No expenses this month');
    }
    return;
  }

  canvas.style.display = '';
  if (emptyEl) emptyEl.style.display = 'none';

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const labels = entries.map(([id]) => catMap[id]?.name || 'Other');
  const data = entries.map(([, v]) => v);
  const colors = entries.map(([id]) => catMap[id]?.color || '#5c6478');

  const isMobile = window.innerWidth < 640;

  dashboardChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: 'rgba(0,0,0,0.3)',
        borderWidth: 2,
        hoverBorderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: !isMobile,
      cutout: '62%',
      plugins: {
        legend: {
          position: isMobile ? 'bottom' : 'right',
          labels: {
            color: '#9ba3b5',
            font: { family: "'Space Mono'", size: isMobile ? 11 : 12 },
            padding: isMobile ? 10 : 14,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
          },
        },
        tooltip: {
          backgroundColor: '#12151f',
          titleColor: '#edf0f7',
          bodyColor: '#9ba3b5',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 10,
          bodyFont: { family: "'Space Mono'" },
          titleFont: { family: "'Space Mono'", weight: 600 },
          callbacks: {
            label: (ctx) => ` ${formatCurrency(ctx.raw)}`,
          },
        },
      },
    },
  });
}

function renderRecentTransactions(transactions, categories) {
  const el = document.getElementById('recent-transactions');
  if (!el) return;

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 5);

  if (recent.length === 0) {
    el.innerHTML = renderEmptyState('No transactions yet');
    return;
  }

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  el.innerHTML = `
    <div class="recent-list">
      ${recent.map(t => {
        const cat = catMap[t.category];
        const isIncome = t.type === 'income';
        return `
          <div class="recent-item">
            ${cat ? `<span class="category-dot" style="background:${cat.color}"></span>` : ''}
            <span class="recent-desc">${t.description || 'No description'}</span>
            <span class="recent-date">${formatDateShort(t.date)}</span>
            <span class="recent-amount ${isIncome ? 'amount-income' : 'amount-expense'}">
              ${isIncome ? '+' : '-'}${formatCurrency(Math.abs(t.amount))}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
