// === Work Packages Page ===
const WPPage = {
  packages: [],

  async init() {
    this.bindEvents();
    await this.loadAll();
    window._onProjectFilterChange = () => this.loadAll();
  },

  bindEvents() {
    document.getElementById('wp-form').addEventListener('submit', (e) => this.handleSubmit(e));
  },

  async loadAll() {
    try {
      const pid = LA.getGlobalProjectId();
      const params = pid ? `?project_id=${pid}` : '';
      const [wpRes, sumRes] = await Promise.all([
        LA.api.get('/workpackages' + params),
        LA.api.get('/workpackages/summary' + params)
      ]);
      this.packages = wpRes.data;

      document.getElementById('wp-total-budget').textContent = LA.formatCurrency(sumRes.data.totalBudget);
      document.getElementById('wp-overall-progress').textContent = sumRes.data.overallProgress + '%';
      document.getElementById('wp-total-count').textContent = sumRes.data.count;

      this.renderCards();
      this.renderGantt();
    } catch (err) {
      LA.toast('Is paketleri yuklenemedi', 'error');
    }
  },

  renderCards() {
    const el = document.getElementById('wp-list');
    if (!this.packages.length) {
      el.innerHTML = '<div class="text-center py-12 text-dark-400"><p class="text-sm">Henuz is paketi yok</p></div>';
      return;
    }

    const statusColors = { planned: 'border-gray-500', in_progress: 'border-blue-500', completed: 'border-green-500', delayed: 'border-orange-500', cancelled: 'border-dark-500' };
    const barColors = { planned: '#627d98', in_progress: '#3b82f6', completed: '#22c55e', delayed: '#f97316', cancelled: '#6b7280' };

    el.innerHTML = this.packages.map(wp => {
      const deliverables = LA.parseJSON(wp.deliverables);
      const milestones = LA.parseJSON(wp.milestones);
      const deps = LA.parseJSON(wp.dependencies);

      return `
      <div class="rounded-2xl bg-dark-900/80 border-l-4 ${statusColors[wp.status]} border border-dark-700/50 p-5 fade-in">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <span class="text-sm font-mono font-bold text-accent-400">${wp.number}</span>
              <h3 class="text-base font-semibold text-white">${wp.title}</h3>
            </div>
            <p class="text-xs text-dark-400">${wp.description || ''}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-medium ${LA.statusColor(wp.status)}">${LA.statusLabel(wp.status)}</span>
            <button onclick="WPPage.showEditModal(${wp.id})" class="p-1.5 rounded-lg hover:bg-dark-800 transition-colors" title="Duzenle">
              <svg class="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="WPPage.deleteWP(${wp.id}, '${wp.title}')" class="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Sil">
              <svg class="w-4 h-4 text-dark-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs text-dark-400">Ilerleme</span>
            <span class="text-xs font-medium text-white">${wp.progress}%</span>
          </div>
          <div class="h-2.5 bg-dark-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500" style="width:${wp.progress}%;background:${barColors[wp.status]}"></div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div class="text-xs"><span class="text-dark-400">Baslangic:</span><br><span class="text-white font-medium">${LA.formatDate(wp.start_date)}</span></div>
          <div class="text-xs"><span class="text-dark-400">Bitis:</span><br><span class="text-white font-medium">${LA.formatDate(wp.end_date)}</span></div>
          <div class="text-xs"><span class="text-dark-400">Butce:</span><br><span class="text-white font-medium">${LA.formatCurrency(wp.budget)}</span></div>
          <div class="text-xs"><span class="text-dark-400">Bagimliliklar:</span><br><span class="text-accent-400 font-medium">${deps.length ? deps.join(', ') : 'Yok'}</span></div>
        </div>

        <!-- Deliverables -->
        ${deliverables.length ? `
        <div class="mb-3">
          <p class="text-xs text-dark-400 mb-1.5">Teslim Edilecekler:</p>
          <div class="flex flex-wrap gap-2">${deliverables.map(d => `<span class="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700/30 text-[10px] text-dark-300">${d}</span>`).join('')}</div>
        </div>` : ''}

        <!-- Milestones -->
        ${milestones.length ? `
        <div>
          <p class="text-xs text-dark-400 mb-1.5">Kilometre Taslari:</p>
          <div class="flex flex-wrap gap-2">${milestones.map(m => `
            <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${m.completed ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-dark-800 border border-dark-700/30 text-dark-300'} text-[10px]">
              ${m.completed ? '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'}
              ${m.title} (${LA.formatDate(m.date)})
            </span>`).join('')}</div>
        </div>` : ''}
      </div>`;
    }).join('');
  },

  renderGantt() {
    if (!this.packages.length) {
      document.getElementById('gantt-container').innerHTML = '<p class="text-sm text-dark-400 text-center py-8">Zaman cizelgesi icin is paketi gerekli</p>';
      return;
    }

    const allDates = this.packages.flatMap(wp => [wp.start_date, wp.end_date].filter(Boolean)).map(d => new Date(d));
    if (!allDates.length) return;
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) || 1;

    const barColors = { planned: '#627d98', in_progress: '#3b82f6', completed: '#22c55e', delayed: '#f97316', cancelled: '#6b7280' };

    let html = '<div class="min-w-[600px]">';

    // Month headers
    html += '<div class="flex mb-2 border-b border-dark-700/30 pb-2">';
    html += '<div class="w-28 flex-shrink-0"></div>';
    html += '<div class="flex-1 relative h-5">';
    let curr = new Date(minDate);
    while (curr <= maxDate) {
      const offset = Math.ceil((curr - minDate) / (1000 * 60 * 60 * 24));
      const pct = (offset / totalDays) * 100;
      const mName = curr.toLocaleDateString('tr-TR', { month: 'short' });
      html += `<span class="absolute text-[9px] text-dark-400" style="left:${pct}%">${mName}</span>`;
      curr.setMonth(curr.getMonth() + 1);
      curr.setDate(1);
    }
    html += '</div></div>';

    // Bars
    this.packages.forEach(wp => {
      if (!wp.start_date || !wp.end_date) return;
      const start = new Date(wp.start_date);
      const end = new Date(wp.end_date);
      const startOffset = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const leftPct = (startOffset / totalDays) * 100;
      const widthPct = (duration / totalDays) * 100;

      html += `<div class="flex items-center mb-3">
        <div class="w-28 flex-shrink-0 text-xs font-mono text-accent-400 pr-3 text-right">${wp.number}</div>
        <div class="flex-1 relative">
          <div class="gantt-bar" style="margin-left:${leftPct}%;width:${widthPct}%;background:${barColors[wp.status]}33;border:1px solid ${barColors[wp.status]}55">
            <div class="gantt-fill" style="width:${wp.progress}%;background:${barColors[wp.status]}"></div>
            <span class="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">${wp.title.substring(0, 30)}${wp.title.length > 30 ? '...' : ''}</span>
          </div>
        </div>
      </div>`;
    });

    // Today line
    const today = new Date();
    if (today >= minDate && today <= maxDate) {
      const todayOffset = Math.ceil((today - minDate) / (1000 * 60 * 60 * 24));
      const todayPct = (todayOffset / totalDays) * 100;
      html += `<div class="relative" style="margin-left:calc(112px + ${todayPct}%)"><div class="absolute bottom-0 w-px h-full bg-red-500/50" style="height:${this.packages.length * 40}px;margin-top:-${this.packages.length * 40}px"></div><span class="text-[9px] text-red-400">Bugun</span></div>`;
    }

    html += '</div>';
    document.getElementById('gantt-container').innerHTML = html;
  },

  showCreateModal() {
    document.getElementById('wp-modal-title').textContent = 'Yeni Is Paketi';
    document.getElementById('wp-form').reset();
    document.getElementById('wp-id').value = '';
    document.getElementById('wp-number').value = 'IP-' + (this.packages.length + 1);
    LA.populateProjectSelect('wp-project', LA.getGlobalProjectId());
    LA.openModal('wp-modal', 'wp-modal-box');
  },

  async showEditModal(id) {
    try {
      const res = await LA.api.get('/workpackages/' + id);
      const wp = res.data;
      document.getElementById('wp-modal-title').textContent = 'Is Paketi Duzenle';
      document.getElementById('wp-id').value = wp.id;
      document.getElementById('wp-number').value = wp.number;
      document.getElementById('wp-title').value = wp.title;
      document.getElementById('wp-description').value = wp.description || '';
      document.getElementById('wp-start').value = wp.start_date || '';
      document.getElementById('wp-end').value = wp.end_date || '';
      document.getElementById('wp-progress').value = wp.progress;
      document.getElementById('wp-budget').value = wp.budget;
      document.getElementById('wp-status').value = wp.status;
      document.getElementById('wp-deliverables').value = LA.parseJSON(wp.deliverables).join('\n');
      LA.populateProjectSelect('wp-project', wp.project_id || '');
      LA.openModal('wp-modal', 'wp-modal-box');
    } catch (err) { LA.toast('Is paketi yuklenemedi', 'error'); }
  },

  closeModal() {
    LA.closeModal('wp-modal', 'wp-modal-box');
  },

  async handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('wp-id').value;
    const delStr = document.getElementById('wp-deliverables').value;
    const deliverables = delStr ? delStr.split('\n').map(d => d.trim()).filter(Boolean) : [];

    const projSel = document.getElementById('wp-project');
    const data = {
      number: document.getElementById('wp-number').value,
      title: document.getElementById('wp-title').value,
      description: document.getElementById('wp-description').value,
      start_date: document.getElementById('wp-start').value || null,
      end_date: document.getElementById('wp-end').value || null,
      progress: parseInt(document.getElementById('wp-progress').value) || 0,
      budget: parseFloat(document.getElementById('wp-budget').value) || 0,
      status: document.getElementById('wp-status').value,
      project_id: projSel ? (projSel.value || null) : null,
      deliverables
    };

    try {
      if (id) { await LA.api.put('/workpackages/' + id, data); LA.toast('Is paketi guncellendi', 'success'); }
      else { await LA.api.post('/workpackages', data); LA.toast('Is paketi olusturuldu', 'success'); }
      this.closeModal();
      this.loadAll();
    } catch (err) { LA.toast(err.message, 'error'); }
  },

  async deleteWP(id, title) {
    const ok = await LA.confirm('Is Paketi Sil', `"${title}" is paketini silmek istediginize emin misiniz?`);
    if (ok) {
      try { await LA.api.del('/workpackages/' + id); LA.toast('Is paketi silindi', 'success'); this.loadAll(); }
      catch (err) { LA.toast(err.message, 'error'); }
    }
  }
};

WPPage.init();
