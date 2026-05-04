// === Materials Library Page ===

const MatLibPage = {
  materials: [],
  _debouncedSearch: LA.debounce(() => MatLibPage.load(), 300),

  async load() {
    try {
      const category = document.getElementById('filter-category').value;
      const is_active = document.getElementById('filter-active').value;
      const search = document.getElementById('filter-search').value;

      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (is_active !== '') params.set('is_active', is_active);
      if (search) params.set('search', search);

      const res = await LA.api.get(`/materials-library?${params}`);
      this.materials = res.data;
      this.render();
      this.renderStats();
    } catch (e) {
      LA.toast('Malzemeler yuklenemedi: ' + e.message, 'error');
    }
  },

  renderStats() {
    const cats = {};
    this.materials.forEach(m => {
      cats[m.category] = (cats[m.category] || 0) + 1;
    });

    const catColors = {
      toz: 'from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30',
      polimer: 'from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30',
      kimyasal: 'from-red-500/20 to-red-600/20 text-red-400 border-red-500/30',
      cozucu: 'from-purple-500/20 to-purple-600/20 text-purple-400 border-purple-500/30',
      katki: 'from-green-500/20 to-green-600/20 text-green-400 border-green-500/30',
      dolgu: 'from-orange-500/20 to-orange-600/20 text-orange-400 border-orange-500/30',
      diger: 'from-gray-500/20 to-gray-600/20 text-gray-400 border-gray-500/30'
    };
    const catLabels = { toz: 'Toz', polimer: 'Polimer', kimyasal: 'Kimyasal', cozucu: 'Cozucu', katki: 'Katki', dolgu: 'Dolgu', diger: 'Diger' };

    const statsEl = document.getElementById('mat-stats');
    statsEl.innerHTML = Object.keys(catColors).map(cat => `
      <div class="rounded-xl bg-gradient-to-br ${catColors[cat]} border p-3 text-center">
        <div class="text-lg font-bold font-mono">${cats[cat] || 0}</div>
        <div class="text-[10px] font-medium uppercase tracking-wider">${catLabels[cat]}</div>
      </div>
    `).join('');
  },

  render() {
    const tbody = document.getElementById('mat-table-body');
    if (this.materials.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-dark-400">Malzeme bulunamadi</td></tr>';
      return;
    }

    const catBadge = (cat) => {
      const colors = { toz: 'bg-amber-500/20 text-amber-300', polimer: 'bg-blue-500/20 text-blue-300', kimyasal: 'bg-red-500/20 text-red-300', cozucu: 'bg-purple-500/20 text-purple-300', katki: 'bg-green-500/20 text-green-300', dolgu: 'bg-orange-500/20 text-orange-300', diger: 'bg-gray-500/20 text-gray-300' };
      const labels = { toz: 'Toz', polimer: 'Polimer', kimyasal: 'Kimyasal', cozucu: 'Cozucu', katki: 'Katki', dolgu: 'Dolgu', diger: 'Diger' };
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[cat] || colors.diger}">${labels[cat] || cat}</span>`;
    };

    tbody.innerHTML = this.materials.map(m => `
      <tr class="hover:bg-dark-800/40 transition-colors">
        <td class="px-4 py-3">
          <div class="font-medium text-white">${m.name}</div>
          ${m.cas_number ? `<div class="text-[10px] text-dark-400 font-mono mt-0.5">${m.cas_number}</div>` : ''}
        </td>
        <td class="px-4 py-3">${catBadge(m.category)}</td>
        <td class="px-4 py-3 text-dark-300">${m.unit}</td>
        <td class="px-4 py-3 text-dark-300">${m.supplier || '-'}</td>
        <td class="px-4 py-3 text-dark-300">${m.cost_per_unit ? m.cost_per_unit.toFixed(2) + ' TL' : '-'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${m.is_active ? 'bg-green-500/20 text-green-300' : 'bg-dark-500/20 text-dark-300'}">
            ${m.is_active ? 'Aktif' : 'Pasif'}
          </span>
        </td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end gap-1">
            <button onclick="MatLibPage.edit(${m.id})" class="p-1.5 rounded-lg hover:bg-dark-700 transition-colors text-dark-400 hover:text-white" title="Duzenle">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="MatLibPage.remove(${m.id})" class="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-dark-400 hover:text-red-400" title="Sil">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  showCreateModal() {
    document.getElementById('mat-id').value = '';
    document.getElementById('mat-modal-title').textContent = 'Yeni Malzeme';
    document.getElementById('mat-form').reset();
    LA.openModal('mat-modal', 'mat-modal-box');
  },

  async edit(id) {
    try {
      const res = await LA.api.get(`/materials-library/${id}`);
      const m = res.data;
      document.getElementById('mat-id').value = m.id;
      document.getElementById('mat-modal-title').textContent = 'Malzeme Duzenle';
      document.getElementById('mat-name').value = m.name;
      document.getElementById('mat-category').value = m.category;
      document.getElementById('mat-unit').value = m.unit;
      document.getElementById('mat-subcategory').value = m.sub_category || '';
      document.getElementById('mat-supplier').value = m.supplier || '';
      document.getElementById('mat-cas').value = m.cas_number || '';
      document.getElementById('mat-density').value = m.density || '';
      document.getElementById('mat-cost').value = m.cost_per_unit || '';
      document.getElementById('mat-description').value = m.description || '';
      LA.openModal('mat-modal', 'mat-modal-box');
    } catch (e) {
      LA.toast('Malzeme yuklenemedi', 'error');
    }
  },

  async save(e) {
    e.preventDefault();
    const id = document.getElementById('mat-id').value;
    const data = {
      name: document.getElementById('mat-name').value,
      category: document.getElementById('mat-category').value,
      unit: document.getElementById('mat-unit').value,
      sub_category: document.getElementById('mat-subcategory').value || null,
      supplier: document.getElementById('mat-supplier').value || null,
      cas_number: document.getElementById('mat-cas').value || null,
      density: parseFloat(document.getElementById('mat-density').value) || null,
      cost_per_unit: parseFloat(document.getElementById('mat-cost').value) || null,
      description: document.getElementById('mat-description').value || null
    };

    try {
      if (id) {
        await LA.api.put(`/materials-library/${id}`, data);
        LA.toast('Malzeme guncellendi', 'success');
      } else {
        await LA.api.post('/materials-library', data);
        LA.toast('Malzeme eklendi', 'success');
      }
      this.closeModal();
      this.load();
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  async remove(id) {
    const ok = await LA.confirm('Malzemeyi Sil', 'Bu malzeme kalici olarak silinecek. Emin misiniz?');
    if (!ok) return;
    try {
      await LA.api.del(`/materials-library/${id}`);
      LA.toast('Malzeme silindi', 'success');
      this.load();
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  closeModal() {
    LA.closeModal('mat-modal', 'mat-modal-box');
  },

  showImportModal() {
    document.getElementById('import-data').value = '';
    document.getElementById('import-preview').classList.add('hidden');
    LA.openModal('import-modal', 'import-modal-box');
  },

  closeImportModal() {
    LA.closeModal('import-modal', 'import-modal-box');
  },

  _parsedImport: [],

  previewImport() {
    const raw = document.getElementById('import-data').value.trim();
    if (!raw) { LA.toast('Veri giriniz', 'warning'); return; }

    const lines = raw.split('\n').filter(l => l.trim());
    this._parsedImport = lines.map(line => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      return {
        name: (parts[0] || '').trim(),
        category: (parts[1] || 'diger').trim().toLowerCase(),
        unit: (parts[2] || 'g').trim(),
        supplier: (parts[3] || '').trim() || null
      };
    }).filter(item => item.name);

    if (this._parsedImport.length === 0) {
      LA.toast('Gecerli veri bulunamadi', 'warning');
      return;
    }

    const tbody = document.getElementById('import-preview-body');
    tbody.innerHTML = this._parsedImport.map(item => `
      <tr class="border-b border-dark-700/30">
        <td class="px-3 py-1.5 text-white">${item.name}</td>
        <td class="px-3 py-1.5 text-dark-300">${item.category}</td>
        <td class="px-3 py-1.5 text-dark-300">${item.unit}</td>
        <td class="px-3 py-1.5 text-dark-300">${item.supplier || '-'}</td>
      </tr>
    `).join('');

    document.getElementById('import-preview').classList.remove('hidden');
  },

  async executeImport() {
    if (this._parsedImport.length === 0) {
      this.previewImport();
      if (this._parsedImport.length === 0) return;
    }

    try {
      const res = await LA.api.post('/materials-library/import', { items: this._parsedImport });
      LA.toast(res.message, 'success');
      this.closeImportModal();
      this.load();
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  MatLibPage.load();
});

// Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    MatLibPage.closeModal();
    MatLibPage.closeImportModal();
  }
});

// Backdrop click
document.addEventListener('click', (e) => {
  if (e.target.id === 'mat-modal') MatLibPage.closeModal();
  if (e.target.id === 'import-modal') MatLibPage.closeImportModal();
});
