/* =====================
   Categories Page
   ===================== */

function initCategories() {
  loadCategories();

  document.getElementById('add-category-btn')
    ?.addEventListener('click', () => openCategoryModal());
}

async function loadCategories() {
  const listEl = document.getElementById('category-list');
  if (!listEl) return;

  // Show cached data immediately
  const cached = api.getCached('/categories');
  if (cached) {
    _renderCategoryList(listEl, cached);
  } else {
    listEl.innerHTML = renderListSkeleton();
  }

  // Always fetch fresh
  try {
    const categories = await api.get('/categories');
    _renderCategoryList(listEl, Array.isArray(categories) ? categories : []);
  } catch (e) {
    if (!cached) listEl.innerHTML = renderEmptyState('Failed to load categories');
  }
}

function _renderCategoryList(listEl, categories) {
  if (categories.length === 0) {
    listEl.innerHTML = renderEmptyState('No categories yet. Create one to get started.');
    return;
  }

  listEl.innerHTML = categories.map(cat => `
    <div class="category-item">
      <span class="category-color" style="background: ${cat.color}"></span>
      <span class="category-name">${cat.name}</span>
      <div class="category-actions">
        <button class="btn-icon" data-edit="${cat.id}" aria-label="Edit">&#9998;</button>
        <button class="btn-icon" data-delete="${cat.id}" aria-label="Delete">&#10005;</button>
      </div>
    </div>
  `).join('');

  // Wire edit buttons
  listEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.edit;
      const cat = categories.find(c => c.id === id);
      if (cat) openCategoryModal(cat);
    });
  });

  // Wire delete buttons
  listEl.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete;
      const cat = categories.find(c => c.id === id);
      openConfirmModal(
        'Delete Category',
        `Are you sure you want to delete "${cat?.name || 'this category'}"?`,
        async () => {
          try {
            await api.delete(`/categories/${id}`);
            showToast('Category deleted');
            loadCategories();
          } catch (e) {
            showToast('Failed to delete', 'error');
          }
        }
      );
    });
  });
}

function openCategoryModal(existing) {
  const isEdit = !!existing;
  const title = isEdit ? 'Edit Category' : 'New Category';

  const bodyHTML = `
    <div class="form-row">
      <label for="cat-name">Name</label>
      <input type="text" id="cat-name" placeholder="e.g. Food, Transport..." value="${existing?.name || ''}" />
    </div>
    <div class="form-row">
      <label>Color</label>
      ${renderColorPicker('cat-color-picker', existing?.color)}
    </div>
  `;

  const { modal } = openModal(title, bodyHTML, async (close) => {
    const name = document.getElementById('cat-name').value.trim();
    const color = getColorPickerValue('cat-color-picker');

    if (!name) {
      showToast('Name is required', 'error');
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/categories/${existing.id}`, { name, color });
        showToast('Category updated');
      } else {
        await api.post('/categories', { name, color });
        showToast('Category created');
      }
      close();
      loadCategories();
    } catch (e) {
      showToast('Failed to save', 'error');
    }
  });

  initColorPicker('cat-color-picker');
}
