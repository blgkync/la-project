// === Experiment Detail Page ===
const ExpDetailPage = {
  exp: null,
  attachments: { all: [], images: [], files: [] },

  async init() {
    const id = EXPERIMENT_ID;
    try {
      const res = await LA.api.get('/experiments/' + id);
      this.exp = res.data;

      document.getElementById('exp-detail-loading').classList.add('hidden');
      document.getElementById('exp-detail-content').classList.remove('hidden');

      // Project badge
      if (this.exp.project_code) {
        document.getElementById('detail-project-badge').innerHTML = LA.projectBadge(this.exp.project_code, this.exp.project_color);
      }

      document.getElementById('detail-title').textContent = this.exp.title;
      document.getElementById('detail-status').textContent = LA.statusLabel(this.exp.status);
      document.getElementById('detail-status').className = 'px-3 py-1 rounded-full text-xs font-medium ' + LA.statusColor(this.exp.status);
      document.getElementById('detail-priority').textContent = LA.priorityLabel(this.exp.priority);
      document.getElementById('detail-priority').className = 'px-3 py-1 rounded-full text-xs font-medium ' + LA.priorityColor(this.exp.priority);
      document.getElementById('detail-researcher').textContent = this.exp.researcher || '';
      document.getElementById('detail-start').textContent = LA.formatDate(this.exp.start_date);
      document.getElementById('detail-end').textContent = LA.formatDate(this.exp.end_date);
      document.getElementById('detail-hypothesis').textContent = this.exp.hypothesis || 'Belirtilmemis';
      document.getElementById('detail-methodology').textContent = this.exp.methodology || 'Belirtilmemis';
      document.getElementById('detail-results').textContent = this.exp.results || 'Henuz sonuc girilmemis';
      document.getElementById('detail-observations').textContent = this.exp.observations || 'Henuz gozlem girilmemis';

      // Tags
      const tags = LA.parseJSON(this.exp.tags);
      document.getElementById('detail-tags').innerHTML = tags.map(t =>
        `<span class="px-2.5 py-1 rounded-full bg-dark-800 border border-dark-700/50 text-xs text-dark-300">${t}</span>`
      ).join('');

      // Parameters
      const params = LA.parseJSON(this.exp.parameters);
      const paramEl = document.getElementById('detail-parameters');
      if (params.length) {
        paramEl.innerHTML = params.map(p => `
          <div class="rounded-xl bg-dark-800/50 border border-dark-700/30 p-3">
            <p class="text-[10px] text-dark-400 uppercase tracking-wider mb-1">${p.key}</p>
            <p class="text-sm text-white font-mono">${p.value}</p>
          </div>
        `).join('');
      } else {
        paramEl.innerHTML = '<p class="text-sm text-dark-400 col-span-full">Parametre tanimlanmamis</p>';
      }

      // Edit button
      document.getElementById('exp-edit-btn').addEventListener('click', () => {
        window.location.href = '/experiments';
      });

      // Delete button
      document.getElementById('exp-delete-btn').addEventListener('click', async () => {
        const confirmed = await LA.confirm('Deney Sil', `"${this.exp.title}" deneyini silmek istediginize emin misiniz?`);
        if (confirmed) {
          try {
            await LA.api.del('/experiments/' + id);
            LA.toast('Deney silindi', 'success');
            setTimeout(() => window.location.href = '/experiments', 500);
          } catch (err) { LA.toast(err.message, 'error'); }
        }
      });

      // Load formulations for this experiment
      await this.loadFormulations();

      // Load attachments
      await this.loadAttachments();

      // Drag & drop
      const dropZone = document.getElementById('exp-attachments');
      if (dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('ring-2', 'ring-accent-500/50'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('ring-2', 'ring-accent-500/50'); });
        dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.classList.remove('ring-2', 'ring-accent-500/50');
          if (e.dataTransfer.files.length) this.uploadFiles(e.dataTransfer.files);
        });
      }

    } catch (err) {
      document.getElementById('exp-detail-loading').innerHTML = `
        <div class="text-center py-12">
          <p class="text-red-400 text-sm">Deney bulunamadi veya yuklenemedi.</p>
          <a href="/experiments" class="text-accent-400 text-sm hover:underline mt-2 inline-block">Deneylere don</a>
        </div>`;
    }
  },

  async loadAttachments() {
    try {
      const res = await LA.api.get('/attachments/experiment/' + EXPERIMENT_ID);
      this.attachments = res.data;
      this.renderAttachments();
    } catch (err) { console.error('Dosyalar yuklenemedi:', err); }
  },

  renderAttachments() {
    const el = document.getElementById('exp-attachments');
    if (!el) return;
    const { images, files } = this.attachments;

    if (!images.length && !files.length) {
      el.innerHTML = `
        <div class="upload-zone border-2 border-dashed border-dark-700/50 rounded-xl p-8 text-center hover:border-accent-500/30 transition-colors">
          <svg class="w-10 h-10 text-dark-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <p class="text-sm text-dark-400">Dosyalari surukleyin veya yukle butonunu kullanin</p>
        </div>`;
      return;
    }

    let html = '';
    if (images.length) {
      html += '<div class="mb-4"><p class="text-xs text-dark-400 mb-2">Resimler</p><div class="grid grid-cols-2 sm:grid-cols-4 gap-3">';
      images.forEach((img, idx) => {
        html += `
          <div class="group relative rounded-xl overflow-hidden bg-dark-800 cursor-pointer" onclick="LA.openLightbox(ExpDetailPage.getLightboxImages(), ${idx})">
            <img src="/uploads/experiments/${img.filename}" alt="${img.original_name}" class="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300">
            <button onclick="event.stopPropagation();ExpDetailPage.deleteAttachment(${img.id})" class="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>`;
      });
      html += '</div></div>';
    }
    if (files.length) {
      html += '<div><p class="text-xs text-dark-400 mb-2">Dosyalar</p><div class="space-y-2">';
      files.forEach(file => {
        html += `
          <div class="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 group">
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <div class="min-w-0">
                <a href="/uploads/experiments/${file.filename}" target="_blank" class="text-xs font-medium text-white hover:text-accent-400 truncate block">${file.original_name}</a>
                <p class="text-[10px] text-dark-400">${LA.formatFileSize(file.file_size)}</p>
              </div>
            </div>
            <button onclick="ExpDetailPage.deleteAttachment(${file.id})" class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all">
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
      url: '/uploads/experiments/' + img.filename,
      caption: img.original_name
    }));
  },

  async uploadFiles(fileList) {
    if (!fileList || !fileList.length) return;
    const formData = new FormData();
    formData.append('entity_type', 'experiment');
    formData.append('entity_id', EXPERIMENT_ID);
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }
    try {
      await LA.api.upload('/attachments/upload', formData);
      LA.toast(fileList.length + ' dosya yuklendi', 'success');
      await this.loadAttachments();
    } catch (err) { LA.toast(err.message, 'error'); }
    const inp = document.getElementById('exp-file-input');
    if (inp) inp.value = '';
  },

  async loadFormulations() {
    try {
      const res = await LA.api.get('/formulations/by-experiment/' + EXPERIMENT_ID);
      const el = document.getElementById('exp-formulations');
      if (!el) return;

      if (!res.data || res.data.length === 0) {
        el.innerHTML = '<p class="text-xs text-dark-400">Bu deneye bagli formulasyon yok</p>';
        return;
      }

      const statusColors = { draft: 'bg-gray-500/20 text-gray-300', prepared: 'bg-blue-500/20 text-blue-300', tested: 'bg-purple-500/20 text-purple-300', approved: 'bg-green-500/20 text-green-300', rejected: 'bg-red-500/20 text-red-300' };
      const statusLabels = { draft: 'Taslak', prepared: 'Hazirlandi', tested: 'Test Edildi', approved: 'Onaylandi', rejected: 'Reddedildi' };

      el.innerHTML = res.data.map(f => `
        <a href="/formulations" class="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 border border-dark-700/30 hover:border-accent-500/30 transition-colors group">
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono text-accent-400 font-semibold">${f.code || ''}</span>
            <span class="text-sm text-white">${f.name}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[f.status] || statusColors.draft}">${statusLabels[f.status] || f.status}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-dark-400">
            <span class="font-mono font-bold">${f.batch_size}g</span>
            <span>${f.item_count || 0} bilesen</span>
            <span class="font-mono ${f.total_percentage == 100 ? 'text-green-400' : 'text-yellow-400'}">%${(f.total_percentage || 0).toFixed(1)}</span>
            <svg class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </a>
      `).join('');
    } catch (e) {
      console.error('Formulasyonlar yuklenemedi:', e);
      const el = document.getElementById('exp-formulations');
      if (el) el.innerHTML = '<p class="text-xs text-dark-400">Formulasyonlar yuklenemedi</p>';
    }
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

ExpDetailPage.init();
