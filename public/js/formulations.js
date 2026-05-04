// === Formulations Page ===

const FrmPage = {
  formulations: [],
  experiments: [],
  _rating: 0,
  _itemCounter: 0,
  _debouncedSearch: LA.debounce(() => FrmPage.load(), 300),

  async init() {
    await this.loadFilters();
    await this.load();
  },

  async loadFilters() {
    try {
      // Load projects into filter and form
      await LA.populateProjectSelect('filter-project');
      await LA.populateProjectSelect('frm-project');

      // Load all experiments for filter
      const expRes = await LA.api.get('/experiments');
      this.experiments = expRes.data;
      this._populateExperimentSelect('filter-experiment', this.experiments);
    } catch (e) {
      console.error('Filter load error:', e);
    }
  },

  _populateExperimentSelect(selectId, experiments, selectedValue) {
    const sel = document.getElementById(selectId);
    const firstOpt = sel.querySelector('option');
    sel.innerHTML = '';
    if (firstOpt) sel.appendChild(firstOpt);
    else { const o = document.createElement('option'); o.value = ''; o.textContent = '-- Deney Sec --'; sel.appendChild(o); }

    experiments.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.title;
      sel.appendChild(opt);
    });
    if (selectedValue) sel.value = selectedValue;
  },

  async onProjectChange() {
    const pid = document.getElementById('filter-project').value;
    // Filter experiments by project
    if (pid) {
      const filtered = this.experiments.filter(e => e.project_id == pid);
      this._populateExperimentSelect('filter-experiment', filtered);
    } else {
      this._populateExperimentSelect('filter-experiment', this.experiments);
    }
    document.getElementById('filter-experiment').value = '';
    this.load();
  },

  async onFormProjectChange() {
    const pid = document.getElementById('frm-project').value;
    if (pid) {
      const filtered = this.experiments.filter(e => e.project_id == pid);
      this._populateExperimentSelect('frm-experiment', filtered);
    } else {
      this._populateExperimentSelect('frm-experiment', this.experiments);
    }
    document.getElementById('frm-experiment').value = '';
  },

  async load() {
    try {
      const params = new URLSearchParams();
      const pid = document.getElementById('filter-project').value;
      const eid = document.getElementById('filter-experiment').value;
      const status = document.getElementById('filter-status').value;
      const search = document.getElementById('filter-search').value;
      if (pid) params.set('project_id', pid);
      if (eid) params.set('experiment_id', eid);
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const res = await LA.api.get(`/formulations?${params}`);
      this.formulations = res.data;
      this.render();
    } catch (e) {
      LA.toast('Formulasyonlar yuklenemedi: ' + e.message, 'error');
    }
  },

  render() {
    const container = document.getElementById('formulations-list');
    const emptyState = document.getElementById('formulations-empty');

    if (this.formulations.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    const statusBadge = (s) => {
      const colors = { draft: 'bg-gray-500/20 text-gray-300', prepared: 'bg-blue-500/20 text-blue-300', tested: 'bg-purple-500/20 text-purple-300', approved: 'bg-green-500/20 text-green-300', rejected: 'bg-red-500/20 text-red-300' };
      const labels = { draft: 'Taslak', prepared: 'Hazirlandi', tested: 'Test Edildi', approved: 'Onaylandi', rejected: 'Reddedildi' };
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[s] || colors.draft}">${labels[s] || s}</span>`;
    };

    const stars = (rating) => {
      if (!rating) return '';
      let html = '<div class="flex gap-0.5">';
      for (let i = 1; i <= 5; i++) {
        html += `<span class="text-xs ${i <= rating ? 'text-yellow-400' : 'text-dark-600'}">&#9733;</span>`;
      }
      html += '</div>';
      return html;
    };

    container.innerHTML = this.formulations.map(f => `
      <div class="group rounded-2xl bg-dark-900/80 border border-dark-700/50 p-5 hover:border-accent-500/30 hover:shadow-lg hover:shadow-accent-500/5 transition-all duration-200 cursor-pointer" onclick="FrmPage.openEditor(${f.id})">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono text-accent-400 font-semibold">${f.code || ''}</span>
              ${f.parent_code ? `<span class="text-[10px] text-dark-400">v${f.version || 2} &larr; ${f.parent_code}</span>` : ''}
            </div>
            <h3 class="text-sm font-semibold text-white truncate">${f.name}</h3>
          </div>
          <div class="flex items-center gap-1 ml-2">
            ${statusBadge(f.status)}
          </div>
        </div>

        ${f.project_code ? `<div class="mb-2">${LA.projectBadge(f.project_code, f.project_color)}</div>` : ''}
        ${f.experiment_title ? `<p class="text-[10px] text-dark-400 mb-2 truncate">Deney: ${f.experiment_title}</p>` : ''}

        <div class="flex items-center gap-3 mt-3">
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-800 text-xs text-white font-mono font-bold">
            ${f.batch_size}${f.batch_unit || 'g'}
          </span>
          <span class="text-xs text-dark-400">${f.item_count || 0} bilesen</span>
          <span class="text-xs font-mono ${f.total_percentage == 100 ? 'text-green-400' : f.total_percentage > 100 ? 'text-red-400' : 'text-yellow-400'}">
            %${(f.total_percentage || 0).toFixed(1)}
          </span>
          ${stars(f.result_rating)}
        </div>
        ${(f.mixing_duration || f.oven_duration) ? `
        <div class="flex items-center gap-3 mt-2">
          ${f.mixing_duration ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-[10px] text-blue-400"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>${f.mixing_duration} dk</span>` : ''}
          ${f.oven_duration ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/10 text-[10px] text-orange-400"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg>${f.oven_duration} dk${f.oven_temp ? ' / ' + f.oven_temp + 'C' : ''}</span>` : ''}
        </div>` : ''}

        <!-- Quick Actions -->
        <div class="flex items-center gap-1 mt-3 pt-3 border-t border-dark-700/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="event.stopPropagation(); FrmPage.openEditor(${f.id})" class="px-2 py-1 rounded-lg text-[10px] text-dark-300 hover:text-white hover:bg-dark-800 transition-colors">Duzenle</button>
          <button onclick="event.stopPropagation(); FrmPage.showCloneModal(${f.id}, '${f.name.replace(/'/g, "\\'")}', ${f.batch_size})" class="px-2 py-1 rounded-lg text-[10px] text-blue-400 hover:bg-blue-500/10 transition-colors">Klonla</button>
          <button onclick="event.stopPropagation(); FrmPage.remove(${f.id})" class="px-2 py-1 rounded-lg text-[10px] text-red-400 hover:bg-red-500/10 transition-colors">Sil</button>
        </div>
      </div>
    `).join('');
  },

  // === Modal & Builder ===

  async showCreateModal() {
    document.getElementById('frm-id').value = '';
    document.getElementById('frm-modal-title').textContent = 'Yeni Formulasyon';
    document.getElementById('frm-form').reset();
    this._rating = 0;
    this._itemCounter = 0;
    this._updateStarUI();

    // Get next code
    try {
      const res = await LA.api.get('/formulations/next-code');
      document.getElementById('frm-code').value = res.data.code;
    } catch (e) {
      document.getElementById('frm-code').value = '';
    }

    // Populate project/experiment dropdowns
    await LA.populateProjectSelect('frm-project');
    this._populateExperimentSelect('frm-experiment', this.experiments);

    // Clear items
    document.getElementById('frm-items-body').innerHTML = '';
    this._updateSummary();
    this._highlightBatchBtn(100);

    LA.openModal('frm-modal', 'frm-modal-box');

    // Add one empty row
    this.addItemRow();
  },

  async openEditor(id) {
    try {
      const res = await LA.api.get(`/formulations/${id}`);
      const f = res.data;

      document.getElementById('frm-id').value = f.id;
      document.getElementById('frm-modal-title').textContent = `${f.code} - Duzenle`;
      document.getElementById('frm-name').value = f.name;
      document.getElementById('frm-code').value = f.code || '';
      document.getElementById('frm-batch-size').value = f.batch_size;
      document.getElementById('frm-status').value = f.status;
      document.getElementById('frm-notes').value = f.notes || '';
      document.getElementById('frm-result-notes').value = f.result_notes || '';
      document.getElementById('frm-description').value = f.description || '';

      document.getElementById('frm-mixing-duration').value = f.mixing_duration || 0;
      document.getElementById('frm-mixing-speed').value = f.mixing_speed || '';
      document.getElementById('frm-mixing-temp').value = f.mixing_temp || '';
      document.getElementById('frm-mixing-notes').value = f.mixing_notes || '';
      document.getElementById('frm-oven-duration').value = f.oven_duration || 0;
      document.getElementById('frm-oven-temp').value = f.oven_temp || '';
      document.getElementById('frm-oven-mode').value = f.oven_mode || '';
      document.getElementById('frm-oven-notes').value = f.oven_notes || '';

      this._rating = f.result_rating || 0;
      this._updateStarUI();

      // Populate project/experiment
      await LA.populateProjectSelect('frm-project', f.project_id);
      if (f.project_id) {
        const filtered = this.experiments.filter(e => e.project_id == f.project_id);
        this._populateExperimentSelect('frm-experiment', filtered, f.experiment_id);
      } else {
        this._populateExperimentSelect('frm-experiment', this.experiments, f.experiment_id);
      }

      // Populate items
      this._itemCounter = 0;
      document.getElementById('frm-items-body').innerHTML = '';
      if (f.items && f.items.length > 0) {
        f.items.forEach(item => this.addItemRow(item));
      }

      this._updateSummary();
      this._highlightBatchBtn(f.batch_size);

      LA.openModal('frm-modal', 'frm-modal-box');
    } catch (e) {
      LA.toast('Formulasyon yuklenemedi: ' + e.message, 'error');
    }
  },

  addItemRow(data = null) {
    this._itemCounter++;
    const idx = this._itemCounter;
    const tbody = document.getElementById('frm-items-body');

    const tr = document.createElement('tr');
    tr.className = 'border-b border-dark-700/30 hover:bg-dark-800/30 transition-colors';
    tr.id = `frm-item-${idx}`;

    tr.innerHTML = `
      <td class="px-3 py-2 text-dark-400 text-center text-xs">${idx}</td>
      <td class="px-3 py-2">
        <div class="relative">
          <input type="text" class="item-material w-full px-2 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-sm text-white focus:outline-none focus:border-accent-500/50"
                 placeholder="Malzeme adi..."
                 value="${data ? data.material_name : ''}"
                 data-material-id="${data ? (data.material_id || '') : ''}"
                 oninput="FrmPage.searchMaterial(this, ${idx})"
                 onfocus="FrmPage.searchMaterial(this, ${idx})"
                 autocomplete="off">
          <input type="hidden" class="item-material-id" value="${data ? (data.material_id || '') : ''}">
          <div class="autocomplete-dropdown absolute top-full left-0 right-0 z-50 mt-1 hidden max-h-48 overflow-y-auto rounded-lg bg-dark-800 border border-dark-700 shadow-xl" id="ac-${idx}"></div>
        </div>
      </td>
      <td class="px-3 py-2">
        <select class="item-category w-full px-2 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-gray-300 focus:outline-none focus:border-accent-500/50">
          <option value="">-</option>
          <option value="toz" ${data && data.category === 'toz' ? 'selected' : ''}>Toz</option>
          <option value="polimer" ${data && data.category === 'polimer' ? 'selected' : ''}>Polimer</option>
          <option value="kimyasal" ${data && data.category === 'kimyasal' ? 'selected' : ''}>Kimyasal</option>
          <option value="cozucu" ${data && data.category === 'cozucu' ? 'selected' : ''}>Cozucu</option>
          <option value="katki" ${data && data.category === 'katki' ? 'selected' : ''}>Katki</option>
          <option value="dolgu" ${data && data.category === 'dolgu' ? 'selected' : ''}>Dolgu</option>
          <option value="diger" ${data && data.category === 'diger' ? 'selected' : ''}>Diger</option>
        </select>
      </td>
      <td class="px-3 py-2">
        <input type="number" step="0.1" min="0" max="100" class="item-percentage w-full px-2 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-sm text-white text-center font-mono focus:outline-none focus:border-accent-500/50"
               value="${data ? data.percentage : ''}"
               oninput="FrmPage.recalcAll()"
               placeholder="0.0">
      </td>
      <td class="px-3 py-2 text-center">
        <span class="item-calculated text-sm font-bold font-mono text-accent-400">${data ? (data.calculated_amount || 0).toFixed(2) : '0.00'}</span>
      </td>
      <td class="px-3 py-2">
        <input type="text" class="item-notes w-full px-2 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-gray-300 focus:outline-none focus:border-accent-500/50" placeholder="Not..." value="${data && data.notes ? data.notes : ''}">
      </td>
      <td class="px-3 py-2 text-center">
        <button type="button" onclick="FrmPage.removeItemRow(${idx})" class="p-1 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
    this._updateSummary();
  },

  removeItemRow(idx) {
    const row = document.getElementById(`frm-item-${idx}`);
    if (row) {
      row.remove();
      this._renumberRows();
      this._updateSummary();
    }
  },

  _renumberRows() {
    const rows = document.querySelectorAll('#frm-items-body tr');
    rows.forEach((row, i) => {
      row.querySelector('td:first-child').textContent = i + 1;
    });
  },

  // === Autocomplete ===
  _acDebounce: null,

  searchMaterial(input, idx) {
    clearTimeout(this._acDebounce);
    const q = input.value.trim();
    const dropdown = document.getElementById(`ac-${idx}`);

    if (q.length < 1) {
      dropdown.classList.add('hidden');
      return;
    }

    this._acDebounce = setTimeout(async () => {
      try {
        const res = await LA.api.get(`/materials-library/search?q=${encodeURIComponent(q)}`);
        const items = res.data;

        if (items.length === 0) {
          dropdown.classList.add('hidden');
          return;
        }

        dropdown.innerHTML = items.map(m => `
          <div class="px-3 py-2 hover:bg-dark-700 cursor-pointer flex items-center justify-between transition-colors"
               onclick="FrmPage.selectMaterial(${idx}, ${m.id}, '${m.name.replace(/'/g, "\\'")}', '${m.category}', '${m.unit}')">
            <span class="text-sm text-white">${m.name}</span>
            <span class="text-[10px] text-dark-400">${m.category} | ${m.supplier || ''}</span>
          </div>
        `).join('');

        dropdown.classList.remove('hidden');
      } catch (e) {
        dropdown.classList.add('hidden');
      }
    }, 200);
  },

  selectMaterial(idx, materialId, name, category, unit) {
    const row = document.getElementById(`frm-item-${idx}`);
    if (!row) return;

    row.querySelector('.item-material').value = name;
    row.querySelector('.item-material').dataset.materialId = materialId;
    row.querySelector('.item-material-id').value = materialId;
    row.querySelector('.item-category').value = category;

    document.getElementById(`ac-${idx}`).classList.add('hidden');
  },

  // === Calculations ===

  setBatchSize(size) {
    document.getElementById('frm-batch-size').value = size;
    this._highlightBatchBtn(size);
    this.recalcAll();
  },

  _highlightBatchBtn(size) {
    document.querySelectorAll('.batch-btn').forEach(btn => {
      if (btn.dataset.size == size) {
        btn.className = btn.className.replace('bg-dark-800 text-gray-300', 'bg-accent-500/20 text-accent-400');
      } else {
        btn.className = btn.className.replace('bg-accent-500/20 text-accent-400', 'bg-dark-800 text-gray-300');
      }
    });
  },

  recalcAll() {
    const batchSize = parseFloat(document.getElementById('frm-batch-size').value) || 0;
    const rows = document.querySelectorAll('#frm-items-body tr');

    let totalPct = 0;
    let totalWeight = 0;

    rows.forEach(row => {
      const pctInput = row.querySelector('.item-percentage');
      const calcSpan = row.querySelector('.item-calculated');
      const pct = parseFloat(pctInput.value) || 0;
      const calc = batchSize * pct / 100;

      calcSpan.textContent = calc.toFixed(2);
      totalPct += pct;
      totalWeight += calc;
    });

    this._updateSummary(totalPct, totalWeight, rows.length);
  },

  _updateSummary(totalPct, totalWeight, count) {
    if (totalPct === undefined) {
      // Recalculate from DOM
      const batchSize = parseFloat(document.getElementById('frm-batch-size').value) || 0;
      const rows = document.querySelectorAll('#frm-items-body tr');
      totalPct = 0;
      totalWeight = 0;
      count = rows.length;
      rows.forEach(row => {
        const pct = parseFloat(row.querySelector('.item-percentage')?.value) || 0;
        totalPct += pct;
        totalWeight += batchSize * pct / 100;
      });
    }

    const pctEl = document.getElementById('frm-total-pct');
    const remainEl = document.getElementById('frm-remaining-pct');
    const weightEl = document.getElementById('frm-total-weight');
    const countEl = document.getElementById('frm-item-count');

    const roundedPct = Math.round(totalPct * 10) / 10;

    pctEl.textContent = roundedPct.toFixed(1);
    if (roundedPct === 100) {
      pctEl.className = 'text-lg font-bold font-mono text-green-400';
    } else if (roundedPct > 100) {
      pctEl.className = 'text-lg font-bold font-mono text-red-400';
    } else {
      pctEl.className = 'text-lg font-bold font-mono text-yellow-400';
    }

    remainEl.textContent = (100 - roundedPct).toFixed(1);
    weightEl.textContent = totalWeight.toFixed(2) + ' g';
    countEl.textContent = count;
  },

  // === Rating ===

  setRating(r) {
    this._rating = (this._rating === r) ? 0 : r;
    this._updateStarUI();
  },

  _updateStarUI() {
    document.querySelectorAll('.star-btn').forEach(btn => {
      const star = parseInt(btn.dataset.star);
      btn.classList.toggle('text-yellow-400', star <= this._rating);
      btn.classList.toggle('text-dark-600', star > this._rating);
    });
  },

  // === Save ===

  async save(e) {
    e.preventDefault();

    const id = document.getElementById('frm-id').value;
    const rows = document.querySelectorAll('#frm-items-body tr');

    const items = [];
    rows.forEach((row, idx) => {
      const materialName = row.querySelector('.item-material').value.trim();
      if (!materialName) return;

      items.push({
        material_id: row.querySelector('.item-material-id').value || null,
        material_name: materialName,
        category: row.querySelector('.item-category').value || null,
        percentage: parseFloat(row.querySelector('.item-percentage').value) || 0,
        unit: 'g',
        notes: row.querySelector('.item-notes').value || null,
        sort_order: idx
      });
    });

    const data = {
      name: document.getElementById('frm-name').value,
      code: document.getElementById('frm-code').value || undefined,
      project_id: document.getElementById('frm-project').value || null,
      experiment_id: document.getElementById('frm-experiment').value || null,
      batch_size: parseFloat(document.getElementById('frm-batch-size').value) || 100,
      status: document.getElementById('frm-status').value,
      mixing_duration: parseInt(document.getElementById('frm-mixing-duration').value) || 0,
      mixing_speed: document.getElementById('frm-mixing-speed').value || null,
      mixing_temp: parseFloat(document.getElementById('frm-mixing-temp').value) || null,
      mixing_notes: document.getElementById('frm-mixing-notes').value || null,
      oven_duration: parseInt(document.getElementById('frm-oven-duration').value) || 0,
      oven_temp: parseFloat(document.getElementById('frm-oven-temp').value) || null,
      oven_mode: document.getElementById('frm-oven-mode').value || null,
      oven_notes: document.getElementById('frm-oven-notes').value || null,
      notes: document.getElementById('frm-notes').value || null,
      result_notes: document.getElementById('frm-result-notes').value || null,
      result_rating: this._rating || null,
      description: document.getElementById('frm-description').value || null,
      items
    };

    try {
      if (id) {
        await LA.api.put(`/formulations/${id}`, data);
        LA.toast('Formulasyon guncellendi', 'success');
      } else {
        await LA.api.post('/formulations', data);
        LA.toast('Formulasyon olusturuldu', 'success');
      }
      this.closeModal();
      this.load();
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  // === Clone ===

  showCloneModal(id, name, batchSize) {
    document.getElementById('clone-source-id').value = id;
    document.getElementById('clone-name').value = name + ' - Varyant';
    document.getElementById('clone-batch-size').value = batchSize;
    LA.openModal('clone-modal', 'clone-modal-box');
  },

  closeCloneModal() {
    LA.closeModal('clone-modal', 'clone-modal-box');
  },

  async executeClone() {
    const sourceId = document.getElementById('clone-source-id').value;
    const name = document.getElementById('clone-name').value;
    const batchSize = parseFloat(document.getElementById('clone-batch-size').value);

    if (!name) { LA.toast('Ad giriniz', 'warning'); return; }

    try {
      const res = await LA.api.post(`/formulations/${sourceId}/clone`, { name, batch_size: batchSize });
      LA.toast('Formulasyon klonlandi', 'success');
      this.closeCloneModal();
      await this.load();
      // Open the cloned formulation in editor
      this.openEditor(res.data.id);
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  // === Delete ===

  async remove(id) {
    const ok = await LA.confirm('Formulasyonu Sil', 'Bu formulasyon kalici olarak silinecek. Emin misiniz?');
    if (!ok) return;
    try {
      await LA.api.del(`/formulations/${id}`);
      LA.toast('Formulasyon silindi', 'success');
      this.load();
    } catch (e) {
      LA.toast(e.message, 'error');
    }
  },

  closeModal() {
    LA.closeModal('frm-modal', 'frm-modal-box');
    // Hide all autocomplete dropdowns
    document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.add('hidden'));
  }
};

// Close autocomplete on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-dropdown') && !e.target.classList.contains('item-material')) {
    document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.add('hidden'));
  }
  if (e.target.id === 'frm-modal') FrmPage.closeModal();
  if (e.target.id === 'clone-modal') FrmPage.closeCloneModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    FrmPage.closeModal();
    FrmPage.closeCloneModal();
  }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  FrmPage.init();
});
