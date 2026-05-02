/* =====================
   Shared Components
   ===================== */

function renderSummaryCard(label, value, accentColor, sub, filterType = null) {
  const extra = filterType ? `data-tx-filter="${filterType}"` : '';
  const cls = filterType ? 'summary-card summary-card--link' : 'summary-card';
  return `
    <div class="${cls}" style="--card-accent: ${accentColor}" ${extra}>
      ${filterType ? `<span class="card-arrow" aria-hidden="true">↗</span>` : ''}
      <div class="card-label">${label}</div>
      <div class="card-value">${value}</div>
      ${sub ? `<div class="card-sub">${sub}</div>` : ''}
    </div>
  `;
}

/* =====================
   Color Picker
   ===================== */

const COLOR_PALETTE = [
  // Reds & pinks
  '#f87171', '#fb7185', '#f472b6', '#e879f9',
  // Oranges & yellows
  '#fb923c', '#fbbf24', '#facc15', '#a3e635',
  // Greens & teals
  '#4ade80', '#34d399', '#2dd4bf', '#22d3ee',
  // Blues & purples
  '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa',
  '#c084fc', '#e0aaff',
  // Warm neutrals & earth
  '#94a3b8', '#a8a29e', '#d4a373', '#c4b5a5',
  '#b8a9c9', '#8fbc8f',
];

function renderColorPicker(id, currentValue) {
  const value = currentValue || COLOR_PALETTE[14]; // default: indigo
  return `
    <div class="color-picker" id="${id}" role="group" aria-label="Color palette">
      ${COLOR_PALETTE.map(color => `
        <button type="button" class="color-swatch${color === value ? ' selected' : ''}"
                data-color="${color}" style="background:${color}"
                aria-label="${color}" title="${color}"></button>
      `).join('')}
    </div>
    <input type="hidden" id="${id}-value" value="${value}">
  `;
}

function getColorPickerValue(id) {
  return document.getElementById(`${id}-value`)?.value || COLOR_PALETTE[14];
}

function initColorPicker(id) {
  const container = document.getElementById(id);
  if (!container) return;
  const input = document.getElementById(`${id}-value`);
  container.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
    if (input) input.value = swatch.dataset.color;
  });
}

function renderMonthSelector(year, month, onChange) {
  const container = document.createElement('div');
  container.className = 'month-selector';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn-icon';
  prevBtn.innerHTML = '&#8592;';
  prevBtn.setAttribute('aria-label', 'Previous month');

  const label = document.createElement('span');
  label.className = 'month-label';
  label.textContent = getMonthName(year, month);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-icon';
  nextBtn.innerHTML = '&#8594;';
  nextBtn.setAttribute('aria-label', 'Next month');

  prevBtn.addEventListener('click', () => {
    let m = month - 1;
    let y = year;
    if (m < 0) { m = 11; y--; }
    onChange(y, m);
  });

  nextBtn.addEventListener('click', () => {
    let m = month + 1;
    let y = year;
    if (m > 11) { m = 0; y++; }
    onChange(y, m);
  });

  container.append(prevBtn, label, nextBtn);
  return container;
}

function renderSummaryCardSkeleton() {
  return `
    <div class="summary-card">
      <div class="skeleton" style="width:45%; height:0.7em; margin-bottom:0.8rem;"></div>
      <div class="skeleton" style="width:75%; height:1.6em; margin-bottom:0.6rem;"></div>
      <div class="skeleton" style="width:55%; height:0.65em;"></div>
    </div>
  `;
}

function renderTableSkeleton(rows = 5) {
  const row = `
    <tr>
      <td><div class="skeleton" style="width:72%; height:0.85em;"></div></td>
      <td><div class="skeleton" style="width:88%; height:0.85em;"></div></td>
      <td><div class="skeleton" style="width:60%; height:0.85em;"></div></td>
      <td><div class="skeleton" style="width:50%; height:0.85em;"></div></td>
      <td></td>
    </tr>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th></th>
          </tr>
        </thead>
        <tbody>${Array(rows).fill(row).join('')}</tbody>
      </table>
    </div>`;
}

function renderListSkeleton(items = 4) {
  const item = `
    <div class="category-item">
      <div class="skeleton" style="width:18px; height:18px; border-radius:50%; flex-shrink:0;"></div>
      <div class="skeleton" style="width:45%; height:0.85em;"></div>
    </div>`;
  return Array(items).fill(item).join('');
}

function renderEmptyState(message, icon = '○') {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

function renderCategoryBadge(name, color) {
  return `
    <span class="category-badge">
      <span class="category-dot" style="background:${color}"></span>
      ${name}
    </span>
  `;
}

function openModal(title, bodyHTML, onConfirm) {
  const root = document.getElementById('modal-root');

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-title">${title}</div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-modal-close>Cancel</button>
          <button class="btn btn-primary" data-modal-confirm>Save</button>
        </div>
      </div>
    </div>
  `;

  const overlay = root.querySelector('.modal-overlay');
  const modal = root.querySelector('.modal');

  function close() {
    root.innerHTML = '';
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  root.querySelector('[data-modal-close]').addEventListener('click', close);

  root.querySelector('[data-modal-confirm]').addEventListener('click', () => {
    if (onConfirm) onConfirm(close);
  });

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });

  return { close, modal };
}

function openConfirmModal(title, message, onConfirm) {
  const root = document.getElementById('modal-root');

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-title">${title}</div>
        <p style="color: var(--color-text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">${message}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-modal-close>Cancel</button>
          <button class="btn btn-danger" data-modal-confirm>Delete</button>
        </div>
      </div>
    </div>
  `;

  const overlay = root.querySelector('.modal-overlay');

  function close() {
    root.innerHTML = '';
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  root.querySelector('[data-modal-close]').addEventListener('click', close);
  root.querySelector('[data-modal-confirm]').addEventListener('click', () => {
    onConfirm();
    close();
  });
}
