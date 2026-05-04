// === Formulation Comparison Page ===

const CmpPage = {
  comparisons: [],
  formulations: [],
  activeComparison: null,

  async init() {
    await this.loadFormulations();
    await this.loadComparisons();
  },

  async loadFormulations() {
    try {
      const res = await LA.api.get('/formulations');
      this.formulations = res.data;
    } catch (e) {
      console.error('Formulation load error:', e);
    }
  },

  async loadComparisons() {
    try {
      const res = await LA.api.get('/comparisons');
      this.comparisons = res.data;
      this.renderList();
    } catch (e) {
      LA.toast('Karsilastirmalar yuklenemedi', 'error');
    }
  },

  renderList() {
    const container = document.getElementById('comparisons-list');
    if (this.comparisons.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 rounded-2xl bg-dark-900/80 border border-dark-700/50">
          <p class="text-dark-400 text-sm mb-3">Henuz karsilastirma olusturulmamis</p>
          <button onclick="CmpPage.showCreateModal()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-600 to-teal-500 text-white text-sm font-medium">Yeni Karsilastirma</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.comparisons.map(c => `
      <div class="rounded-2xl bg-dark-900/80 border border-dark-700/50 p-4 hover:border-accent-500/30 transition-colors cursor-pointer flex items-center justify-between"
           onclick="CmpPage.viewComparison(${c.id})">
        <div>
          <h3 class="text-sm font-semibold text-white">${c.name}</h3>
          <p class="text-xs text-dark-400 mt-1">${c.formulation_count || 0} formulasyon | ${LA.formatDate(c.created_at)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="event.stopPropagation(); CmpPage.deleteComparison(${c.id})" class="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
          <svg class="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    `).join('');
  },

  async viewComparison(id) {
    try {
      const res = await LA.api.get(`/comparisons/${id}`);
      this.activeComparison = res.data;
      this.renderComparisonTable();
    } catch (e) {
      LA.toast('Karsilastirma yuklenemedi', 'error');
    }
  },

  renderComparisonTable() {
    const cmp = this.activeComparison;
    if (!cmp || !cmp.formulations || cmp.formulations.length === 0) {
      document.getElementById('comparison-view').classList.add('hidden');
      return;
    }

    document.getElementById('comparison-view').classList.remove('hidden');
    document.getElementById('comparison-title').textContent = cmp.name;

    const formulations = cmp.formulations;

    // Collect all unique materials across all formulations
    const materialMap = new Map();
    formulations.forEach(f => {
      (f.items || []).forEach(item => {
        const key = item.material_name;
        if (!materialMap.has(key)) {
          materialMap.set(key, { name: item.material_name, category: item.category });
        }
      });
    });

    const allMaterials = Array.from(materialMap.values());

    // Build header
    const thead = document.getElementById('comparison-thead');
    thead.innerHTML = `
      <tr class="border-b border-dark-700/50">
        <th class="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider sticky left-0 bg-dark-900/95 backdrop-blur z-10">Malzeme</th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider sticky left-0 bg-dark-900/95 backdrop-blur z-10 w-20">Kategori</th>
        ${formulations.map(f => `
          <th class="px-4 py-3 text-center text-xs font-semibold text-white min-w-[140px]">
            <div class="flex flex-col items-center gap-1">
              <span class="text-accent-400 font-mono">${f.code || ''}</span>
              <span class="text-white text-[11px]">${f.name}</span>
              <span class="text-dark-400 text-[10px] font-mono">${f.batch_size}${f.batch_unit || 'g'}</span>
              <button onclick="CmpPage.removeFormulation(${f.id})" class="text-[9px] text-red-400 hover:text-red-300 mt-1">cikar</button>
            </div>
          </th>
        `).join('')}
      </tr>
    `;

    // Build body
    const tbody = document.getElementById('comparison-tbody');
    tbody.innerHTML = allMaterials.map(mat => {
      const cells = formulations.map(f => {
        const item = (f.items || []).find(i => i.material_name === mat.name);
        if (!item) return '<td class="px-4 py-2 text-center text-dark-600">-</td>';

        // Check if this value differs from others
        const allPcts = formulations.map(ff => {
          const fi = (ff.items || []).find(i => i.material_name === mat.name);
          return fi ? fi.percentage : null;
        }).filter(p => p !== null);
        const allSame = allPcts.every(p => p === allPcts[0]);

        return `
          <td class="px-4 py-2 text-center ${!allSame ? 'bg-amber-500/5' : ''}">
            <div class="font-mono text-sm text-white font-medium">%${item.percentage}</div>
            <div class="text-[10px] text-accent-400 font-mono">${item.calculated_amount.toFixed(2)}g</div>
          </td>
        `;
      }).join('');

      const catBadge = mat.category ? `<span class="text-[9px] text-dark-400">${mat.category}</span>` : '';

      return `
        <tr class="border-b border-dark-700/30 hover:bg-dark-800/30 transition-colors">
          <td class="px-4 py-2 text-sm text-white font-medium sticky left-0 bg-dark-900/95 backdrop-blur">${mat.name}</td>
          <td class="px-4 py-2 sticky left-0 bg-dark-900/95 backdrop-blur">${catBadge}</td>
          ${cells}
        </tr>
      `;
    }).join('');

    // Build footer (totals + process params)
    const tfoot = document.getElementById('comparison-tfoot');
    tfoot.innerHTML = `
      <tr class="border-t-2 border-dark-600">
        <td class="px-4 py-3 text-sm font-semibold text-white sticky left-0 bg-dark-900/95 backdrop-blur" colspan="2">Toplam %</td>
        ${formulations.map(f => {
          const total = (f.items || []).reduce((sum, i) => sum + i.percentage, 0);
          const color = total === 100 ? 'text-green-400' : total > 100 ? 'text-red-400' : 'text-yellow-400';
          return `<td class="px-4 py-3 text-center font-bold font-mono text-sm ${color}">%${total.toFixed(1)}</td>`;
        }).join('')}
      </tr>
      <tr class="border-t border-dark-700/50">
        <td class="px-4 py-2 text-xs text-dark-400 sticky left-0 bg-dark-900/95 backdrop-blur" colspan="2">Toplam Agirlik</td>
        ${formulations.map(f => {
          const total = (f.items || []).reduce((sum, i) => sum + i.calculated_amount, 0);
          return `<td class="px-4 py-2 text-center text-xs font-mono text-dark-300">${total.toFixed(2)}g</td>`;
        }).join('')}
      </tr>
      <tr class="border-t border-blue-500/20 bg-blue-500/5">
        <td class="px-4 py-2 text-xs font-medium text-blue-400 sticky left-0 bg-dark-900/95 backdrop-blur" colspan="2">Karistirici</td>
        ${formulations.map(f => {
          const parts = [];
          if (f.mixing_duration) parts.push(f.mixing_duration + ' dk');
          if (f.mixing_speed) parts.push(f.mixing_speed);
          if (f.mixing_temp) parts.push(f.mixing_temp + 'C');
          const allDurations = formulations.map(ff => ff.mixing_duration || 0);
          const differ = !allDurations.every(d => d === allDurations[0]);
          return `<td class="px-4 py-2 text-center text-xs font-mono ${differ ? 'bg-amber-500/5' : ''} text-blue-300">${parts.length ? parts.join(' / ') : '-'}</td>`;
        }).join('')}
      </tr>
      <tr class="border-t border-orange-500/20 bg-orange-500/5">
        <td class="px-4 py-2 text-xs font-medium text-orange-400 sticky left-0 bg-dark-900/95 backdrop-blur" colspan="2">Etuv</td>
        ${formulations.map(f => {
          const parts = [];
          if (f.oven_duration) parts.push(f.oven_duration + ' dk');
          if (f.oven_temp) parts.push(f.oven_temp + 'C');
          if (f.oven_mode) parts.push(f.oven_mode);
          const allDurations = formulations.map(ff => ff.oven_duration || 0);
          const differ = !allDurations.every(d => d === allDurations[0]);
          return `<td class="px-4 py-2 text-center text-xs font-mono ${differ ? 'bg-amber-500/5' : ''} text-orange-300">${parts.length ? parts.join(' / ') : '-'}</td>`;
        }).join('')}
      </tr>
    `;
  },

  // === Create Comparison ===

  async showCreateModal() {
    document.getElementById('cmp-name').value = '';
    document.getElementById('cmp-notes').value = '';

    // Load formulation checklist
    if (this.formulations.length === 0) await this.loadFormulations();

    const checklist = document.getElementById('cmp-formulation-checklist');
    checklist.innerHTML = this.formulations.map(f => `
      <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer">
        <input type="checkbox" value="${f.id}" class="cmp-frm-check rounded bg-dark-700 border-dark-600 text-accent-500 focus:ring-accent-500/30">
        <span class="text-sm text-white">${f.code} - ${f.name}</span>
        <span class="text-[10px] text-dark-400 ml-auto">${f.batch_size}g</span>
      </label>
    `).join('');

    LA.openModal('cmp-modal', 'cmp-modal-box');
  },

  closeCreateModal() {
    LA.closeModal('cmp-modal', 'cmp-modal-box');
  },

  async createComparison() {
    const name = document.getElementById('cmp-name').value.trim();
    if (!name) { LA.toast('Ad giriniz', 'warning'); return; }

    const checked = document.querySelectorAll('.cmp-frm-check:checked');
    const ids = Array.from(checked).map(c => parseInt(c.value));
    if (ids.length < 2) { LA.toast('En az 2 formulasyon seciniz', 'warning'); return; }

    try {
      const res = await LA.api.post('/comparisons', {
        name,
        notes: document.getElementById('cmp-notes').value || null,
        formulation_ids: ids
      });
      LA.toast('Karsilastirma olusturuldu', 'success');
      this.closeCreateModal();
      await this.loadComparisons();
      this.viewComparison(res.data.id);
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  // === Add/Remove Formulation ===

  addFormulation() {
    if (!this.activeComparison) return;

    const sel = document.getElementById('add-frm-select');
    sel.innerHTML = '<option value="">-- Formulasyon Sec --</option>';
    const existingIds = this.activeComparison.formulations.map(f => f.id);

    this.formulations.filter(f => !existingIds.includes(f.id)).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.code} - ${f.name} (${f.batch_size}g)`;
      sel.appendChild(opt);
    });

    LA.openModal('add-frm-modal', 'add-frm-modal-box');
  },

  closeAddModal() {
    LA.closeModal('add-frm-modal', 'add-frm-modal-box');
  },

  async executeAddFormulation() {
    const fId = document.getElementById('add-frm-select').value;
    if (!fId) { LA.toast('Formulasyon seciniz', 'warning'); return; }

    try {
      await LA.api.post(`/comparisons/${this.activeComparison.id}/formulations`, { formulation_id: parseInt(fId) });
      LA.toast('Formulasyon eklendi', 'success');
      this.closeAddModal();
      this.viewComparison(this.activeComparison.id);
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  async removeFormulation(formulationId) {
    if (!this.activeComparison) return;
    try {
      await LA.api.del(`/comparisons/${this.activeComparison.id}/formulations/${formulationId}`);
      LA.toast('Formulasyon cikarildi', 'success');
      this.viewComparison(this.activeComparison.id);
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  async deleteComparison(id) {
    const ok = await LA.confirm('Karsilastirmayi Sil', 'Bu karsilastirma silinecek. Emin misiniz?');
    if (!ok) return;
    try {
      await LA.api.del(`/comparisons/${id}`);
      LA.toast('Karsilastirma silindi', 'success');
      if (this.activeComparison && this.activeComparison.id === id) {
        this.activeComparison = null;
        document.getElementById('comparison-view').classList.add('hidden');
      }
      this.loadComparisons();
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  // === CSV Export ===

  exportCSV() {
    if (!this.activeComparison || !this.activeComparison.formulations) return;

    const cmp = this.activeComparison;
    const formulations = cmp.formulations;

    // Collect materials
    const materialMap = new Map();
    formulations.forEach(f => {
      (f.items || []).forEach(item => {
        if (!materialMap.has(item.material_name)) {
          materialMap.set(item.material_name, { name: item.material_name, category: item.category });
        }
      });
    });
    const allMaterials = Array.from(materialMap.values());

    // Build CSV
    const rows = [];
    // Header
    rows.push(['Malzeme', 'Kategori', ...formulations.map(f => `${f.code} (%) `), ...formulations.map(f => `${f.code} (g)`)].join(','));

    // Data rows
    allMaterials.forEach(mat => {
      const pcts = formulations.map(f => {
        const item = (f.items || []).find(i => i.material_name === mat.name);
        return item ? item.percentage : '';
      });
      const amounts = formulations.map(f => {
        const item = (f.items || []).find(i => i.material_name === mat.name);
        return item ? item.calculated_amount.toFixed(2) : '';
      });
      rows.push([mat.name, mat.category || '', ...pcts, ...amounts].join(','));
    });

    // Totals
    const totalPcts = formulations.map(f => (f.items || []).reduce((s, i) => s + i.percentage, 0).toFixed(1));
    const totalAmounts = formulations.map(f => (f.items || []).reduce((s, i) => s + i.calculated_amount, 0).toFixed(2));
    rows.push(['TOPLAM', '', ...totalPcts, ...totalAmounts].join(','));

    // Process params
    rows.push('');
    rows.push(['Karistirici (dk)', '', ...formulations.map(f => f.mixing_duration || ''), ...formulations.map(() => '')].join(','));
    rows.push(['Karistirici Hiz', '', ...formulations.map(f => f.mixing_speed || ''), ...formulations.map(() => '')].join(','));
    rows.push(['Karistirici Sicaklik (C)', '', ...formulations.map(f => f.mixing_temp || ''), ...formulations.map(() => '')].join(','));
    rows.push(['Etuv (dk)', '', ...formulations.map(f => f.oven_duration || ''), ...formulations.map(() => '')].join(','));
    rows.push(['Etuv Sicaklik (C)', '', ...formulations.map(f => f.oven_temp || ''), ...formulations.map(() => '')].join(','));
    rows.push(['Etuv Mod', '', ...formulations.map(f => f.oven_mode || ''), ...formulations.map(() => '')].join(','));

    const csv = rows.join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cmp.name.replace(/\s+/g, '_')}_karsilastirma.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  CmpPage.init();
});

document.addEventListener('click', (e) => {
  if (e.target.id === 'cmp-modal') CmpPage.closeCreateModal();
  if (e.target.id === 'add-frm-modal') CmpPage.closeAddModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    CmpPage.closeCreateModal();
    CmpPage.closeAddModal();
  }
});
