// === Project Detail Page ===
const PrjDetailPage = {
  project: null,
  attachments: { all: [], images: [], files: [] },

  async init() {
    try {
      const res = await LA.api.get('/projects/' + PROJECT_ID);
      this.project = res.data;

      document.getElementById('prj-detail-loading').classList.add('hidden');
      document.getElementById('prj-detail-content').classList.remove('hidden');

      this.renderHeader();
      this.renderStats();
      this.renderBudget();
      this.renderExperiments();
      this.renderWorkPackages();
      this.renderEntries();
      this.renderEvents();
      await this.loadAttachments();
      this.bindEvents();
    } catch (err) {
      document.getElementById('prj-detail-loading').innerHTML = `
        <div class="text-center py-12">
          <p class="text-red-400 text-sm">Proje bulunamadi veya yuklenemedi.</p>
          <a href="/projects" class="text-accent-400 text-sm hover:underline mt-2 inline-block">Projelere don</a>
        </div>`;
    }
  },

  bindEvents() {
    document.getElementById('prj-edit-btn').addEventListener('click', () => {
      window.location.href = '/projects';
    });

    document.getElementById('prj-delete-btn').addEventListener('click', async () => {
      const ok = await LA.confirm('Proje Sil', `"${this.project.name}" projesini silmek istediginize emin misiniz? Iliskili veriler projeden kopacaktir.`);
      if (ok) {
        try {
          await LA.api.del('/projects/' + PROJECT_ID);
          LA.toast('Proje silindi', 'success');
          setTimeout(() => window.location.href = '/projects', 500);
        } catch (err) { LA.toast(err.message, 'error'); }
      }
    });

    // Drag & drop zone
    const dropZone = document.getElementById('prj-attachments');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('ring-2', 'ring-accent-500/50'); });
      dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('ring-2', 'ring-accent-500/50'); });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('ring-2', 'ring-accent-500/50');
        if (e.dataTransfer.files.length) this.uploadFiles(e.dataTransfer.files);
      });
    }
  },

  renderHeader() {
    const prj = this.project;
    const codeEl = document.getElementById('detail-prj-code');
    codeEl.textContent = prj.code;
    codeEl.style.background = prj.color + '22';
    codeEl.style.color = prj.color;

    const typeEl = document.getElementById('detail-prj-type-badge');
    typeEl.textContent = LA.projectTypeLabel(prj.type);
    typeEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ' + LA.projectTypeColor(prj.type);

    document.getElementById('detail-prj-name').textContent = prj.name;
    document.getElementById('detail-prj-desc').textContent = prj.description || '';

    const statusEl = document.getElementById('detail-prj-status');
    statusEl.textContent = LA.statusLabel(prj.status);
    statusEl.className = 'px-3 py-1 rounded-full text-xs font-medium ' + LA.statusColor(prj.status);

    document.getElementById('detail-prj-pi').textContent = prj.pi_name || '-';
    document.getElementById('detail-prj-dates').textContent = `${LA.formatDate(prj.start_date)} - ${LA.formatDate(prj.end_date)}`;

    // Header card top border
    document.getElementById('prj-header-card').style.borderTopColor = prj.color;
    document.getElementById('prj-header-card').style.borderTopWidth = '3px';

    // Tags
    const tags = LA.parseJSON(prj.tags);
    document.getElementById('detail-prj-tags').innerHTML = tags.map(t =>
      `<span class="px-2.5 py-1 rounded-full bg-dark-800 border border-dark-700/50 text-xs text-dark-300">${t}</span>`
    ).join('');
  },

  renderStats() {
    const s = this.project.stats || {};
    document.getElementById('detail-stat-exp').textContent = s.experiments || 0;
    document.getElementById('detail-stat-wp').textContent = (s.wpProgress || 0) + '%';
    document.getElementById('detail-stat-entries').textContent = s.labEntries || 0;

    const budgetPct = this.project.budget > 0 ? Math.round((this.project.spent / this.project.budget) * 100) : 0;
    document.getElementById('detail-stat-budget').textContent = budgetPct + '%';
  },

  renderBudget() {
    const prj = this.project;
    const budgetPct = prj.budget > 0 ? Math.round((prj.spent / prj.budget) * 100) : 0;
    const budgetColor = budgetPct > 80 ? '#ef4444' : budgetPct > 50 ? '#f59e0b' : prj.color;

    document.getElementById('detail-budget-text').textContent = `${LA.formatCurrency(prj.spent)} / ${LA.formatCurrency(prj.budget)} (%${budgetPct})`;
    const bar = document.getElementById('detail-budget-bar');
    bar.style.width = Math.min(budgetPct, 100) + '%';
    bar.style.background = budgetColor;
  },

  renderExperiments() {
    const el = document.getElementById('detail-experiments');
    const exps = this.project.experiments || [];
    if (!exps.length) {
      el.innerHTML = '<p class="text-xs text-dark-400 text-center py-4">Bu projede deney yok</p>';
      return;
    }
    el.innerHTML = exps.map(exp => `
      <a href="/experiments/${exp.id}" class="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors group">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-white truncate group-hover:text-accent-400 transition-colors">${exp.title}</p>
          <p class="text-[10px] text-dark-400 mt-0.5">${exp.researcher || ''} - ${LA.formatDate(exp.start_date)}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-medium ml-2 flex-shrink-0 ${LA.statusColor(exp.status)}">${LA.statusLabel(exp.status)}</span>
      </a>
    `).join('');
  },

  renderWorkPackages() {
    const el = document.getElementById('detail-workpackages');
    const wps = this.project.workPackages || [];
    if (!wps.length) {
      el.innerHTML = '<p class="text-xs text-dark-400 text-center py-4">Bu projede is paketi yok</p>';
      return;
    }
    const barColors = { planned: '#627d98', in_progress: '#3b82f6', completed: '#22c55e', delayed: '#f97316', cancelled: '#6b7280' };
    el.innerHTML = wps.map(wp => `
      <div class="p-3 rounded-xl bg-dark-800/50">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono font-bold text-accent-400">${wp.number}</span>
            <span class="text-xs font-medium text-white">${wp.title}</span>
          </div>
          <span class="text-[10px] text-dark-400">${wp.progress}%</span>
        </div>
        <div class="h-1.5 bg-dark-900 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" style="width:${wp.progress}%;background:${barColors[wp.status] || '#3b82f6'}"></div>
        </div>
      </div>
    `).join('');
  },

  renderEntries() {
    const el = document.getElementById('detail-entries');
    const entries = this.project.recentEntries || [];
    if (!entries.length) {
      el.innerHTML = '<p class="text-xs text-dark-400 text-center py-4">Kayit yok</p>';
      return;
    }
    el.innerHTML = entries.map(e => `
      <div class="flex gap-3 p-3 rounded-xl bg-dark-800/50">
        <div class="w-7 h-7 rounded-lg ${LA.categoryColor(e.category)} flex items-center justify-center flex-shrink-0">${LA.categoryIcon(e.category)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-medium text-white">${e.author}</span>
            <span class="text-[10px] text-dark-400">${LA.formatDateTime(e.created_at)}</span>
          </div>
          <p class="text-[10px] text-gray-400 line-clamp-2 mt-0.5">${e.content}</p>
        </div>
      </div>
    `).join('');
  },

  renderEvents() {
    const el = document.getElementById('detail-events');
    const events = this.project.upcomingEvents || [];
    if (!events.length) {
      el.innerHTML = '<p class="text-xs text-dark-400 text-center py-4">Yaklasan etkinlik yok</p>';
      return;
    }
    el.innerHTML = events.map(ev => `
      <div class="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-white">${ev.title}</p>
          <p class="text-[10px] text-dark-400 mt-0.5">${LA.formatDateTime(ev.start_datetime)}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-medium ${LA.eventTypeColor(ev.event_type)}">${LA.eventTypeLabel(ev.event_type)}</span>
      </div>
    `).join('');
  },

  async loadAttachments() {
    try {
      const res = await LA.api.get('/attachments/project/' + PROJECT_ID);
      this.attachments = res.data;
      this.renderAttachments();
    } catch (err) {
      console.error('Dosyalar yuklenemedi:', err);
    }
  },

  renderAttachments() {
    const el = document.getElementById('prj-attachments');
    const { images, files } = this.attachments;

    if (!images.length && !files.length) {
      el.innerHTML = `
        <div class="upload-zone border-2 border-dashed border-dark-700/50 rounded-xl p-8 text-center hover:border-accent-500/30 transition-colors">
          <svg class="w-10 h-10 text-dark-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <p class="text-sm text-dark-400">Dosyalari surukleyin veya yukle butonunu kullanin</p>
          <p class="text-[10px] text-dark-500 mt-1">Resim, PDF, Excel, Word, CSV desteklenir (max 10MB)</p>
        </div>`;
      return;
    }

    let html = '';

    // Image gallery
    if (images.length) {
      html += '<div class="mb-4"><p class="text-xs text-dark-400 mb-2">Resimler</p><div class="grid grid-cols-2 sm:grid-cols-4 gap-3">';
      images.forEach((img, idx) => {
        html += `
          <div class="group relative rounded-xl overflow-hidden bg-dark-800 cursor-pointer" onclick="LA.openLightbox(PrjDetailPage.getLightboxImages(), ${idx})">
            <img src="/uploads/projects/${img.filename}" alt="${img.original_name}" class="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
            </div>
            <button onclick="event.stopPropagation();PrjDetailPage.deleteAttachment(${img.id})" class="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>`;
      });
      html += '</div></div>';
    }

    // File list
    if (files.length) {
      html += '<div><p class="text-xs text-dark-400 mb-2">Dosyalar</p><div class="space-y-2">';
      files.forEach(file => {
        const icon = file.mimetype.includes('pdf') ? 'text-red-400' : file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') ? 'text-green-400' : 'text-blue-400';
        html += `
          <div class="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 group">
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 ${icon} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <div class="min-w-0">
                <a href="/uploads/projects/${file.filename}" target="_blank" class="text-xs font-medium text-white hover:text-accent-400 truncate block">${file.original_name}</a>
                <p class="text-[10px] text-dark-400">${LA.formatFileSize(file.file_size)} - ${LA.formatDate(file.created_at)}</p>
              </div>
            </div>
            <button onclick="PrjDetailPage.deleteAttachment(${file.id})" class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all">
              <svg class="w-4 h-4 text-dark-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>`;
      });
      html += '</div></div>';
    }

    el.innerHTML = html;
  },

  getLightboxImages() {
    return this.attachments.images.map(img => ({
      url: '/uploads/projects/' + img.filename,
      caption: img.original_name
    }));
  },

  async uploadFiles(fileList) {
    if (!fileList || !fileList.length) return;
    const formData = new FormData();
    formData.append('entity_type', 'project');
    formData.append('entity_id', PROJECT_ID);
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }
    try {
      await LA.api.upload('/attachments/upload', formData);
      LA.toast(fileList.length + ' dosya yuklendi', 'success');
      await this.loadAttachments();
    } catch (err) {
      LA.toast(err.message, 'error');
    }
    // Reset file input
    const inp = document.getElementById('prj-file-input');
    if (inp) inp.value = '';
  },

  async deleteAttachment(id) {
    const ok = await LA.confirm('Dosya Sil', 'Bu dosyayi silmek istediginize emin misiniz?');
    if (ok) {
      try {
        await LA.api.del('/attachments/' + id);
        LA.toast('Dosya silindi', 'success');
        await this.loadAttachments();
      } catch (err) { LA.toast(err.message, 'error'); }
    }
  }
};

PrjDetailPage.init();
