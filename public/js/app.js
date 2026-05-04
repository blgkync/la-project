// === LA Project - Core Utilities ===

const LA = {
  // Global project filter state
  _currentProjectId: null,
  _projects: [],

  // API Client
  api: {
    baseURL: '/api/v1',
    async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
      };
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'API Hatasi');
      return data;
    },
    get(ep) { return this.request(ep); },
    post(ep, body) { return this.request(ep, { method: 'POST', body }); },
    put(ep, body) { return this.request(ep, { method: 'PUT', body }); },
    del(ep) { return this.request(ep, { method: 'DELETE' }); },
    // Special upload method (no JSON headers)
    async upload(endpoint, formData) {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Yukleme hatasi');
      return data;
    }
  },

  // Toast Notifications
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const colors = {
      success: 'from-green-500 to-emerald-600',
      error: 'from-red-500 to-rose-600',
      warning: 'from-yellow-500 to-amber-600',
      info: 'from-blue-500 to-indigo-600'
    };
    const icons = {
      success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
      error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
      warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
      info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
    };

    const el = document.createElement('div');
    el.className = `pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r ${colors[type]} text-white shadow-2xl transform translate-x-[120%] transition-transform duration-300`;
    el.innerHTML = `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[type]}</svg><span class="text-sm font-medium">${message}</span>`;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.remove('translate-x-[120%]'));

    setTimeout(() => {
      el.classList.add('translate-x-[120%]');
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  // Confirm Modal
  _confirmResolve: null,
  confirm(title, message, actionText = 'Sil') {
    return new Promise(resolve => {
      this._confirmResolve = resolve;
      const modal = document.getElementById('confirm-modal');
      const box = document.getElementById('confirm-modal-box');
      document.getElementById('confirm-modal-title').textContent = title;
      document.getElementById('confirm-modal-message').textContent = message;
      const actionBtn = document.getElementById('confirm-modal-action');
      actionBtn.textContent = actionText;
      actionBtn.onclick = () => { this.closeConfirm(); resolve(true); };
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      requestAnimationFrame(() => { box.classList.remove('scale-95', 'opacity-0'); box.classList.add('scale-100', 'opacity-100'); });
    });
  },

  closeConfirm() {
    const modal = document.getElementById('confirm-modal');
    const box = document.getElementById('confirm-modal-box');
    box.classList.add('scale-95', 'opacity-0');
    box.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200);
    if (this._confirmResolve) { this._confirmResolve(false); this._confirmResolve = null; }
  },

  // Modal helpers
  openModal(modalId, boxId) {
    const modal = document.getElementById(modalId);
    const box = document.getElementById(boxId);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => { box.classList.remove('scale-95', 'opacity-0'); box.classList.add('scale-100', 'opacity-100'); });
  },

  closeModal(modalId, boxId) {
    const modal = document.getElementById(modalId);
    const box = document.getElementById(boxId);
    box.classList.add('scale-95', 'opacity-0');
    box.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200);
  },

  // Lightbox
  _lightboxImages: [],
  _lightboxIndex: 0,

  openLightbox(images, index = 0) {
    this._lightboxImages = images;
    this._lightboxIndex = index;
    this._showLightboxImage();
    const modal = document.getElementById('lightbox-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  lightboxPrev() {
    this._lightboxIndex = (this._lightboxIndex - 1 + this._lightboxImages.length) % this._lightboxImages.length;
    this._showLightboxImage();
  },

  lightboxNext() {
    this._lightboxIndex = (this._lightboxIndex + 1) % this._lightboxImages.length;
    this._showLightboxImage();
  },

  _showLightboxImage() {
    const img = this._lightboxImages[this._lightboxIndex];
    if (!img) return;
    document.getElementById('lightbox-image').src = img.url;
    document.getElementById('lightbox-caption').textContent = img.caption || img.original_name || '';
  },

  // Formatting
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(amount || 0);
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Status labels
  statusLabel(status) {
    const map = { planned: 'Planli', in_progress: 'Devam Ediyor', completed: 'Tamamlandi', failed: 'Basarisiz', on_hold: 'Beklemede', delayed: 'Gecikmeli', cancelled: 'Iptal', pending: 'Bekliyor', active: 'Aktif' };
    return map[status] || status;
  },

  statusColor(status) {
    const map = { planned: 'bg-gray-500/20 text-gray-300', in_progress: 'bg-blue-500/20 text-blue-300', completed: 'bg-green-500/20 text-green-300', failed: 'bg-red-500/20 text-red-300', on_hold: 'bg-yellow-500/20 text-yellow-300', delayed: 'bg-orange-500/20 text-orange-300', cancelled: 'bg-dark-500/20 text-dark-300', active: 'bg-green-500/20 text-green-300' };
    return map[status] || 'bg-gray-500/20 text-gray-300';
  },

  priorityLabel(p) {
    const map = { low: 'Dusuk', medium: 'Orta', high: 'Yuksek', critical: 'Kritik' };
    return map[p] || p;
  },

  priorityColor(p) {
    const map = { low: 'bg-gray-500/20 text-gray-300', medium: 'bg-blue-500/20 text-blue-300', high: 'bg-orange-500/20 text-orange-300', critical: 'bg-red-500/20 text-red-300' };
    return map[p] || 'bg-gray-500/20 text-gray-300';
  },

  categoryLabel(c) {
    const map = { observation: 'Gozlem', measurement: 'Olcum', note: 'Not', issue: 'Sorun', idea: 'Fikir' };
    return map[c] || c;
  },

  categoryIcon(c) {
    const map = {
      observation: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>',
      measurement: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
      note: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>',
      issue: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
      idea: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>'
    };
    return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">${map[c] || map.note}</svg>`;
  },

  categoryColor(c) {
    const map = { observation: 'text-blue-400 bg-blue-500/10', measurement: 'text-purple-400 bg-purple-500/10', note: 'text-gray-400 bg-gray-500/10', issue: 'text-red-400 bg-red-500/10', idea: 'text-yellow-400 bg-yellow-500/10' };
    return map[c] || 'text-gray-400 bg-gray-500/10';
  },

  eventTypeLabel(t) {
    const map = { experiment: 'Deney', meeting: 'Toplanti', deadline: 'Son Tarih', maintenance: 'Bakim', review: 'Degerlendirme' };
    return map[t] || t;
  },

  eventTypeColor(t) {
    const map = { experiment: 'bg-blue-500/20 text-blue-300', meeting: 'bg-purple-500/20 text-purple-300', deadline: 'bg-red-500/20 text-red-300', maintenance: 'bg-orange-500/20 text-orange-300', review: 'bg-green-500/20 text-green-300' };
    return map[t] || 'bg-gray-500/20 text-gray-300';
  },

  equipStatusLabel(s) {
    const map = { available: 'Kullanilabilir', in_use: 'Kullanimda', maintenance: 'Bakimda', out_of_order: 'Arizali' };
    return map[s] || s;
  },

  equipStatusColor(s) {
    const map = { available: 'bg-green-500/20 text-green-300', in_use: 'bg-blue-500/20 text-blue-300', maintenance: 'bg-orange-500/20 text-orange-300', out_of_order: 'bg-red-500/20 text-red-300' };
    return map[s] || 'bg-gray-500/20 text-gray-300';
  },

  projectTypeLabel(t) {
    const map = { tubitak: 'TUBITAK', lab: 'Lab', arge: 'ArGe', other: 'Diger' };
    return map[t] || t;
  },

  projectTypeColor(t) {
    const map = { tubitak: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', lab: 'bg-amber-500/20 text-amber-300 border-amber-500/30', arge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', other: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
    return map[t] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  },

  // Project badge HTML
  projectBadge(project_code, project_color) {
    if (!project_code) return '';
    const c = project_color || '#627d98';
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold" style="background:${c}22;color:${c};border:1px solid ${c}33"><span class="w-1.5 h-1.5 rounded-full" style="background:${c}"></span>${project_code}</span>`;
  },

  // Parse JSON safely
  parseJSON(str, fallback = []) {
    if (!str) return fallback;
    if (typeof str === 'object') return str;
    try { return JSON.parse(str); } catch { return fallback; }
  },

  // Debounce
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  },

  // Global project filter
  getGlobalProjectId() {
    return this._currentProjectId || '';
  },

  async setGlobalProject(projectId) {
    this._currentProjectId = projectId || '';
    localStorage.setItem('la_project_filter', this._currentProjectId);

    // Update header badge
    const badge = document.getElementById('header-project-badge');
    if (projectId && this._projects.length) {
      const prj = this._projects.find(p => p.id == projectId);
      if (prj) {
        badge.textContent = prj.code;
        badge.style.color = prj.color;
        badge.style.borderColor = prj.color + '44';
        badge.style.background = prj.color + '15';
        badge.classList.remove('hidden');
      }
    } else {
      badge.classList.add('hidden');
    }

    // Trigger page reload of data
    if (typeof window._onProjectFilterChange === 'function') {
      window._onProjectFilterChange(projectId);
    }
  },

  async loadProjectsForFilter() {
    try {
      const res = await this.api.get('/projects/active');
      this._projects = res.data;
      const sel = document.getElementById('global-project-filter');
      if (!sel) return;

      // Clear and rebuild
      sel.innerHTML = '<option value="">Tum Projeler</option>';
      res.data.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.code} - ${p.name}`;
        opt.style.color = p.color;
        sel.appendChild(opt);
      });

      // Restore saved selection
      const saved = localStorage.getItem('la_project_filter');
      if (saved) {
        sel.value = saved;
        this.setGlobalProject(saved);
      }
    } catch (e) {
      console.error('Proje listesi yuklenemedi:', e);
    }
  },

  // Populate project selector in forms
  async populateProjectSelect(selectId, selectedValue) {
    if (!this._projects.length) {
      try {
        const res = await this.api.get('/projects/active');
        this._projects = res.data;
      } catch (e) { return; }
    }
    const sel = document.getElementById(selectId);
    if (!sel) return;
    // Keep the first option if it exists
    const firstOpt = sel.querySelector('option');
    sel.innerHTML = '';
    if (firstOpt) sel.appendChild(firstOpt);
    else { const o = document.createElement('option'); o.value = ''; o.textContent = '-- Proje Sec --'; sel.appendChild(o); }

    this._projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.code} - ${p.name}`;
      sel.appendChild(opt);
    });
    if (selectedValue) sel.value = selectedValue;
  }
};

// Initialize global project filter on page load
document.addEventListener('DOMContentLoaded', () => {
  LA.loadProjectsForFilter();
});

// Close modals on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.id === 'confirm-modal') LA.closeConfirm();
  if (e.target.id === 'lightbox-modal') LA.closeLightbox();
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    LA.closeConfirm();
    LA.closeLightbox();
    if (typeof ExpPage !== 'undefined' && ExpPage.closeModal) ExpPage.closeModal();
    if (typeof CalPage !== 'undefined' && CalPage.closeModal) CalPage.closeModal();
    if (typeof CalPage !== 'undefined' && CalPage.closeDetailModal) CalPage.closeDetailModal();
    if (typeof WPPage !== 'undefined' && WPPage.closeModal) WPPage.closeModal();
    if (typeof NBPage !== 'undefined' && NBPage.closeModal) NBPage.closeModal();
    if (typeof EqPage !== 'undefined') { EqPage.closeEquipModal?.(); EqPage.closeMatModal?.(); }
    if (typeof PrjPage !== 'undefined' && PrjPage.closeModal) PrjPage.closeModal();
    if (typeof FrmPage !== 'undefined') { FrmPage.closeModal?.(); FrmPage.closeCloneModal?.(); }
    if (typeof MatLibPage !== 'undefined') { MatLibPage.closeModal?.(); MatLibPage.closeImportModal?.(); }
    if (typeof CmpPage !== 'undefined') { CmpPage.closeCreateModal?.(); CmpPage.closeAddModal?.(); }
  }
  // Lightbox arrow keys
  if (e.key === 'ArrowLeft') LA.lightboxPrev();
  if (e.key === 'ArrowRight') LA.lightboxNext();
});

// Expose user info for role-based UI
document.addEventListener('DOMContentLoaded', () => {
  if (window.LA_USER && window.LA_USER.role !== 'admin') {
    document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = 'none');
  }
});
