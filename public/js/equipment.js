// === Equipment & Materials Page ===
const EqPage = {
  currentTab: 'equipment',

  async init() {
    this.bindEvents();
    await this.loadEquipment();
    window._onProjectFilterChange = () => {
      if (this.currentTab === 'equipment') this.loadEquipment();
      else this.loadMaterials();
    };
  },

  bindEvents() {
    document.getElementById('eq-filter-status').addEventListener('change', () => this.loadEquipment());
    document.getElementById('eq-search').addEventListener('input', LA.debounce(() => this.loadEquipment(), 300));
    document.getElementById('mat-search').addEventListener('input', LA.debounce(() => this.loadMaterials(), 300));
    document.getElementById('equip-form').addEventListener('submit', (e) => this.handleEquipSubmit(e));
    document.getElementById('mat-form').addEventListener('submit', (e) => this.handleMatSubmit(e));
  },

  setTab(tab) {
    this.currentTab = tab;
    const eqBtn = document.getElementById('tab-equipment');
    const matBtn = document.getElementById('tab-materials');
    const eqSec = document.getElementById('equipment-section');
    const matSec = document.getElementById('materials-section');

    if (tab === 'equipment') {
      eqBtn.className = 'px-4 py-2 rounded-md text-sm font-medium transition-colors bg-accent-500/10 text-accent-400';
      matBtn.className = 'px-4 py-2 rounded-md text-sm font-medium transition-colors text-dark-400 hover:text-white';
      eqSec.classList.remove('hidden');
      matSec.classList.add('hidden');
      this.loadEquipment();
    } else {
      matBtn.className = 'px-4 py-2 rounded-md text-sm font-medium transition-colors bg-accent-500/10 text-accent-400';
      eqBtn.className = 'px-4 py-2 rounded-md text-sm font-medium transition-colors text-dark-400 hover:text-white';
      matSec.classList.remove('hidden');
      eqSec.classList.add('hidden');
      this.loadMaterials();
    }
  },

  // --- Equipment ---
  async loadEquipment() {
    try {
      const params = new URLSearchParams();
      const status = document.getElementById('eq-filter-status').value;
      const search = document.getElementById('eq-search').value;
      const pid = LA.getGlobalProjectId();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (pid) params.set('project_id', pid);

      const res = await LA.api.get('/equipment?' + params.toString());
      this.renderEquipment(res.data);
    } catch (err) { LA.toast('Ekipman yuklenemedi', 'error'); }
  },

  renderEquipment(items) {
    const el = document.getElementById('equipment-grid');
    if (!items.length) {
      el.innerHTML = '<div class="col-span-full text-center py-12 text-dark-400"><p class="text-sm">Ekipman bulunamadi</p></div>';
      return;
    }

    const statusIcons = {
      available: '<div class="w-2 h-2 rounded-full bg-green-400"></div>',
      in_use: '<div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>',
      maintenance: '<div class="w-2 h-2 rounded-full bg-orange-400"></div>',
      out_of_order: '<div class="w-2 h-2 rounded-full bg-red-400 pulse-alert"></div>'
    };

    el.innerHTML = items.map(eq => `
      <div class="rounded-2xl bg-dark-900/80 border border-dark-700/50 p-5 hover:border-dark-600/50 transition-all fade-in">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            ${statusIcons[eq.status] || ''}
            <h3 class="text-sm font-semibold text-white">${eq.name}</h3>
          </div>
          <div class="flex gap-1">
            <button onclick="EqPage.showEquipEditModal(${eq.id})" class="p-1 rounded hover:bg-dark-800 transition-colors"><svg class="w-3.5 h-3.5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
            <button onclick="EqPage.deleteEquip(${eq.id}, '${eq.name}')" class="p-1 rounded hover:bg-red-500/10 transition-colors"><svg class="w-3.5 h-3.5 text-dark-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
          </div>
        </div>
        <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mb-3 ${LA.equipStatusColor(eq.status)}">${LA.equipStatusLabel(eq.status)}</span>
        <div class="space-y-1.5 text-xs text-dark-400">
          ${eq.model ? `<div><span class="text-dark-500">Model:</span> <span class="text-gray-300">${eq.model}</span></div>` : ''}
          ${eq.serial_no ? `<div><span class="text-dark-500">Seri No:</span> <span class="text-gray-300 font-mono text-[10px]">${eq.serial_no}</span></div>` : ''}
          ${eq.location ? `<div><span class="text-dark-500">Konum:</span> <span class="text-gray-300">${eq.location}</span></div>` : ''}
          ${eq.last_calibration ? `<div><span class="text-dark-500">Son Kalibrasyon:</span> <span class="text-gray-300">${LA.formatDate(eq.last_calibration)}</span></div>` : ''}
          ${eq.next_maintenance ? `<div><span class="text-dark-500">Sonraki Bakim:</span> <span class="${new Date(eq.next_maintenance) < new Date() ? 'text-red-400' : 'text-gray-300'}">${LA.formatDate(eq.next_maintenance)}</span></div>` : ''}
        </div>
        ${eq.notes ? `<p class="text-[10px] text-dark-400 mt-3 pt-3 border-t border-dark-700/30">${eq.notes}</p>` : ''}
      </div>
    `).join('');
  },

  showEquipModal() {
    document.getElementById('equip-modal-title').textContent = 'Yeni Ekipman';
    document.getElementById('equip-form').reset();
    document.getElementById('equip-id').value = '';
    LA.populateProjectSelect('equip-project', LA.getGlobalProjectId());
    LA.openModal('equip-modal', 'equip-modal-box');
  },

  async showEquipEditModal(id) {
    try {
      const res = await LA.api.get('/equipment/' + id);
      const eq = res.data;
      document.getElementById('equip-modal-title').textContent = 'Ekipman Duzenle';
      document.getElementById('equip-id').value = eq.id;
      document.getElementById('equip-name').value = eq.name;
      document.getElementById('equip-model').value = eq.model || '';
      document.getElementById('equip-serial').value = eq.serial_no || '';
      document.getElementById('equip-location').value = eq.location || '';
      document.getElementById('equip-status').value = eq.status;
      document.getElementById('equip-calibration').value = eq.last_calibration || '';
      document.getElementById('equip-maintenance').value = eq.next_maintenance || '';
      document.getElementById('equip-notes').value = eq.notes || '';
      LA.populateProjectSelect('equip-project', eq.project_id || '');
      LA.openModal('equip-modal', 'equip-modal-box');
    } catch (err) { LA.toast('Ekipman yuklenemedi', 'error'); }
  },

  closeEquipModal() { LA.closeModal('equip-modal', 'equip-modal-box'); },

  async handleEquipSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('equip-id').value;
    const projSel = document.getElementById('equip-project');
    const data = {
      name: document.getElementById('equip-name').value,
      model: document.getElementById('equip-model').value,
      serial_no: document.getElementById('equip-serial').value,
      location: document.getElementById('equip-location').value,
      status: document.getElementById('equip-status').value,
      last_calibration: document.getElementById('equip-calibration').value || null,
      next_maintenance: document.getElementById('equip-maintenance').value || null,
      notes: document.getElementById('equip-notes').value,
      project_id: projSel ? (projSel.value || null) : null
    };
    try {
      if (id) { await LA.api.put('/equipment/' + id, data); LA.toast('Ekipman guncellendi', 'success'); }
      else { await LA.api.post('/equipment', data); LA.toast('Ekipman olusturuldu', 'success'); }
      this.closeEquipModal();
      this.loadEquipment();
    } catch (err) { LA.toast(err.message, 'error'); }
  },

  async deleteEquip(id, name) {
    const ok = await LA.confirm('Ekipman Sil', `"${name}" ekipmanini silmek istediginize emin misiniz?`);
    if (ok) {
      try { await LA.api.del('/equipment/' + id); LA.toast('Ekipman silindi', 'success'); this.loadEquipment(); }
      catch (err) { LA.toast(err.message, 'error'); }
    }
  },

  // --- Materials ---
  async loadMaterials(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const search = document.getElementById('mat-search').value;
      const pid = LA.getGlobalProjectId();
      if (search) params.set('search', search);
      if (pid) params.set('project_id', pid);

      const res = await LA.api.get('/materials?' + params.toString());
      this.renderMaterials(res.data);
    } catch (err) { LA.toast('Malzemeler yuklenemedi', 'error'); }
  },

  renderMaterials(items) {
    const wrapper = document.getElementById('materials-table-wrapper');
    if (!items.length) {
      wrapper.innerHTML = '<div class="text-center py-12 text-dark-400"><p class="text-sm">Malzeme bulunamadi</p></div>';
      return;
    }

    let html = `<table class="w-full text-sm">
      <thead><tr class="border-b border-dark-700">
        <th class="text-left py-3 px-4 text-xs text-dark-400 font-medium">Malzeme</th>
        <th class="text-left py-3 px-4 text-xs text-dark-400 font-medium">Miktar</th>
        <th class="text-left py-3 px-4 text-xs text-dark-400 font-medium">Min Esik</th>
        <th class="text-left py-3 px-4 text-xs text-dark-400 font-medium">Tedarikci</th>
        <th class="text-left py-3 px-4 text-xs text-dark-400 font-medium">Konum</th>
        <th class="text-left py-3 px-4 text-xs text-dark-400 font-medium">Durum</th>
        <th class="text-right py-3 px-4 text-xs text-dark-400 font-medium">Islem</th>
      </tr></thead><tbody>`;

    items.forEach(m => {
      const isLow = m.quantity <= m.min_threshold;
      html += `<tr class="border-b border-dark-700/30 hover:bg-dark-800/30 transition-colors">
        <td class="py-3 px-4">
          <div class="text-xs font-medium text-white">${m.name}</div>
          ${m.notes ? `<div class="text-[10px] text-dark-400 mt-0.5">${m.notes.substring(0, 50)}${m.notes.length > 50 ? '...' : ''}</div>` : ''}
        </td>
        <td class="py-3 px-4 text-xs ${isLow ? 'text-red-400 font-bold' : 'text-gray-300'}">${m.quantity} ${m.unit}</td>
        <td class="py-3 px-4 text-xs text-dark-400">${m.min_threshold} ${m.unit}</td>
        <td class="py-3 px-4 text-xs text-gray-300">${m.supplier || '-'}</td>
        <td class="py-3 px-4 text-xs text-gray-300">${m.location || '-'}</td>
        <td class="py-3 px-4">${isLow ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-300">Dusuk Stok</span>' : '<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-300">Yeterli</span>'}</td>
        <td class="py-3 px-4 text-right">
          <div class="flex justify-end gap-1">
            <button onclick="EqPage.showMatEditModal(${m.id})" class="p-1 rounded hover:bg-dark-800 transition-colors"><svg class="w-3.5 h-3.5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
            <button onclick="EqPage.deleteMat(${m.id}, '${m.name}')" class="p-1 rounded hover:bg-red-500/10 transition-colors"><svg class="w-3.5 h-3.5 text-dark-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
          </div>
        </td>
      </tr>`;
    });

    html += '</tbody></table>';
    wrapper.innerHTML = html;
  },

  showMatModal() {
    document.getElementById('mat-modal-title').textContent = 'Yeni Malzeme';
    document.getElementById('mat-form').reset();
    document.getElementById('mat-id').value = '';
    LA.populateProjectSelect('mat-project', LA.getGlobalProjectId());
    LA.openModal('mat-modal', 'mat-modal-box');
  },

  async showMatEditModal(id) {
    try {
      const res = await LA.api.get('/materials/' + id);
      const m = res.data;
      document.getElementById('mat-modal-title').textContent = 'Malzeme Duzenle';
      document.getElementById('mat-id').value = m.id;
      document.getElementById('mat-name').value = m.name;
      document.getElementById('mat-quantity').value = m.quantity;
      document.getElementById('mat-unit').value = m.unit;
      document.getElementById('mat-threshold').value = m.min_threshold;
      document.getElementById('mat-supplier').value = m.supplier || '';
      document.getElementById('mat-location').value = m.location || '';
      document.getElementById('mat-notes').value = m.notes || '';
      LA.populateProjectSelect('mat-project', m.project_id || '');
      LA.openModal('mat-modal', 'mat-modal-box');
    } catch (err) { LA.toast('Malzeme yuklenemedi', 'error'); }
  },

  closeMatModal() { LA.closeModal('mat-modal', 'mat-modal-box'); },

  async handleMatSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('mat-id').value;
    const matProjSel = document.getElementById('mat-project');
    const data = {
      name: document.getElementById('mat-name').value,
      quantity: parseFloat(document.getElementById('mat-quantity').value) || 0,
      unit: document.getElementById('mat-unit').value,
      min_threshold: parseFloat(document.getElementById('mat-threshold').value) || 0,
      supplier: document.getElementById('mat-supplier').value,
      location: document.getElementById('mat-location').value,
      notes: document.getElementById('mat-notes').value,
      project_id: matProjSel ? (matProjSel.value || null) : null
    };
    try {
      if (id) { await LA.api.put('/materials/' + id, data); LA.toast('Malzeme guncellendi', 'success'); }
      else { await LA.api.post('/materials', data); LA.toast('Malzeme olusturuldu', 'success'); }
      this.closeMatModal();
      this.loadMaterials();
    } catch (err) { LA.toast(err.message, 'error'); }
  },

  async deleteMat(id, name) {
    const ok = await LA.confirm('Malzeme Sil', `"${name}" malzemesini silmek istediginize emin misiniz?`);
    if (ok) {
      try { await LA.api.del('/materials/' + id); LA.toast('Malzeme silindi', 'success'); this.loadMaterials(); }
      catch (err) { LA.toast(err.message, 'error'); }
    }
  }
};

EqPage.init();
