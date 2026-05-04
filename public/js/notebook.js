// === Lab Notebook Page ===
const NBPage = {
  entries: [],

  async init() {
    this.bindEvents();
    await Promise.all([this.loadEntries(), this.loadAuthors(), this.loadExperiments()]);
    window._onProjectFilterChange = () => this.loadEntries();
  },

  bindEvents() {
    document.getElementById('nb-filter-category').addEventListener('change', () => this.loadEntries());
    document.getElementById('nb-filter-author').addEventListener('change', () => this.loadEntries());
    document.getElementById('nb-filter-search').addEventListener('input', LA.debounce(() => this.loadEntries(), 300));
    document.getElementById('nb-form').addEventListener('submit', (e) => this.handleSubmit(e));
  },

  async loadAuthors() {
    try {
      const res = await LA.api.get('/notebook/authors');
      const sel = document.getElementById('nb-filter-author');
      res.data.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a; opt.textContent = a;
        sel.appendChild(opt);
      });
    } catch (e) {}
  },

  async loadExperiments() {
    try {
      const res = await LA.api.get('/experiments');
      const sel = document.getElementById('nb-experiment');
      // Clear existing options except the first one
      while (sel.options.length > 1) sel.remove(1);
      res.data.forEach(exp => {
        const opt = document.createElement('option');
        opt.value = exp.id; opt.textContent = exp.title;
        sel.appendChild(opt);
      });
    } catch (e) {}
  },

  async loadEntries() {
    try {
      const params = new URLSearchParams();
      const cat = document.getElementById('nb-filter-category').value;
      const author = document.getElementById('nb-filter-author').value;
      const search = document.getElementById('nb-filter-search').value;
      const pid = LA.getGlobalProjectId();
      if (cat) params.set('category', cat);
      if (author) params.set('author', author);
      if (search) params.set('search', search);
      if (pid) params.set('project_id', pid);

      const res = await LA.api.get('/notebook?' + params.toString());
      this.entries = res.data;
      this.renderTimeline();
    } catch (err) {
      LA.toast('Kayitlar yuklenemedi', 'error');
    }
  },

  renderTimeline() {
    const el = document.getElementById('notebook-timeline');
    if (!this.entries.length) {
      el.innerHTML = '<div class="text-center py-12 text-dark-400 ml-10"><p class="text-sm">Henuz kayit yok</p></div>';
      return;
    }

    const categoryDots = {
      observation: 'bg-blue-500', measurement: 'bg-purple-500',
      note: 'bg-gray-500', issue: 'bg-red-500', idea: 'bg-yellow-500'
    };

    let html = '<div class="absolute left-[19px] top-0 bottom-0 w-px bg-dark-700/50"></div><div class="space-y-4">';

    this.entries.forEach(entry => {
      const tags = LA.parseJSON(entry.tags);
      html += `
      <div class="relative flex gap-4 fade-in">
        <div class="flex-shrink-0 w-10 flex items-start justify-center pt-5 relative z-10">
          <div class="w-3 h-3 rounded-full ${categoryDots[entry.category] || 'bg-gray-500'} ring-4 ring-dark-950"></div>
        </div>
        <div class="flex-1 rounded-2xl bg-dark-900/80 border border-dark-700/50 p-4 hover:border-dark-600/50 transition-colors">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg ${LA.categoryColor(entry.category)} flex items-center justify-center flex-shrink-0">${LA.categoryIcon(entry.category)}</div>
              <div>
                <span class="text-xs font-medium text-white">${entry.author}</span>
                <span class="text-[10px] text-dark-400 ml-2">${LA.formatDateTime(entry.created_at)}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${LA.categoryColor(entry.category)}">${LA.categoryLabel(entry.category)}</span>
              <button onclick="NBPage.showEditModal(${entry.id})" class="p-1 rounded hover:bg-dark-800 transition-colors"><svg class="w-3.5 h-3.5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
              <button onclick="NBPage.deleteEntry(${entry.id})" class="p-1 rounded hover:bg-red-500/10 transition-colors"><svg class="w-3.5 h-3.5 text-dark-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
            </div>
          </div>
          <p class="text-sm text-gray-300 leading-relaxed mb-2">${entry.content}</p>
          <div class="flex items-center justify-between">
            ${entry.experiment_title ? `<a href="/experiments/${entry.related_experiment_id}" class="text-[10px] text-accent-400 hover:underline">${entry.experiment_title}</a>` : '<span></span>'}
            <div class="flex gap-1">${tags.map(t => `<span class="px-1.5 py-0.5 rounded bg-dark-800 text-[9px] text-dark-300">${t}</span>`).join('')}</div>
          </div>
        </div>
      </div>`;
    });

    html += '</div>';
    el.innerHTML = html;
  },

  showCreateModal() {
    document.getElementById('nb-modal-title').textContent = 'Yeni Kayit';
    document.getElementById('nb-form').reset();
    document.getElementById('nb-id').value = '';
    LA.populateProjectSelect('nb-project', LA.getGlobalProjectId());
    LA.openModal('nb-modal', 'nb-modal-box');
  },

  async showEditModal(id) {
    try {
      const res = await LA.api.get('/notebook/' + id);
      const entry = res.data;
      document.getElementById('nb-modal-title').textContent = 'Kayit Duzenle';
      document.getElementById('nb-id').value = entry.id;
      document.getElementById('nb-author').value = entry.author;
      document.getElementById('nb-category').value = entry.category;
      document.getElementById('nb-content').value = entry.content;
      document.getElementById('nb-experiment').value = entry.related_experiment_id || '';
      document.getElementById('nb-tags').value = LA.parseJSON(entry.tags).join(', ');
      LA.populateProjectSelect('nb-project', entry.project_id || '');
      LA.openModal('nb-modal', 'nb-modal-box');
    } catch (err) { LA.toast('Kayit yuklenemedi', 'error'); }
  },

  closeModal() {
    LA.closeModal('nb-modal', 'nb-modal-box');
  },

  async handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('nb-id').value;
    const tagsStr = document.getElementById('nb-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const expId = document.getElementById('nb-experiment').value;

    const projSel = document.getElementById('nb-project');
    const data = {
      author: document.getElementById('nb-author').value,
      category: document.getElementById('nb-category').value,
      content: document.getElementById('nb-content').value,
      related_experiment_id: expId ? parseInt(expId) : null,
      project_id: projSel ? (projSel.value || null) : null,
      tags
    };

    try {
      if (id) { await LA.api.put('/notebook/' + id, data); LA.toast('Kayit guncellendi', 'success'); }
      else { await LA.api.post('/notebook', data); LA.toast('Kayit olusturuldu', 'success'); }
      this.closeModal();
      this.loadEntries();
    } catch (err) { LA.toast(err.message, 'error'); }
  },

  async deleteEntry(id) {
    const ok = await LA.confirm('Kayit Sil', 'Bu kaydi silmek istediginize emin misiniz?');
    if (ok) {
      try { await LA.api.del('/notebook/' + id); LA.toast('Kayit silindi', 'success'); this.loadEntries(); }
      catch (err) { LA.toast(err.message, 'error'); }
    }
  }
};

NBPage.init();
