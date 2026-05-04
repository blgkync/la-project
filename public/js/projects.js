// === Projects Page ===
const PrjPage = {
  projects: [],

  async init() {
    this.bindEvents();
    await this.loadProjects();
  },

  bindEvents() {
    document.getElementById('prj-filter-type').addEventListener('change', () => this.loadProjects());
    document.getElementById('prj-filter-status').addEventListener('change', () => this.loadProjects());
    document.getElementById('prj-filter-search').addEventListener('input', LA.debounce(() => this.loadProjects(), 300));
    document.getElementById('project-form').addEventListener('submit', (e) => this.handleSubmit(e));
  },

  async loadProjects() {
    try {
      const params = new URLSearchParams();
      const type = document.getElementById('prj-filter-type').value;
      const status = document.getElementById('prj-filter-status').value;
      const search = document.getElementById('prj-filter-search').value;
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const res = await LA.api.get('/projects?' + params.toString());
      this.projects = res.data;
      this.render();
    } catch (err) {
      LA.toast('Projeler yuklenemedi', 'error');
    }
  },

  render() {
    const el = document.getElementById('projects-grid');
    if (!this.projects.length) {
      el.innerHTML = '<div class="col-span-full text-center py-12 text-dark-400"><p class="text-sm">Henuz proje bulunamadi</p></div>';
      return;
    }

    el.innerHTML = this.projects.map(prj => {
      const tags = LA.parseJSON(prj.tags);
      const s = prj.stats || {};
      const budgetPct = prj.budget > 0 ? Math.round((prj.spent / prj.budget) * 100) : 0;
      const budgetColor = budgetPct > 80 ? '#ef4444' : budgetPct > 50 ? '#f59e0b' : prj.color;

      return `
      <a href="/projects/${prj.id}" class="block group relative overflow-hidden rounded-2xl bg-dark-900/80 border border-dark-700/50 p-5 hover:border-dark-600/50 hover:-translate-y-0.5 transition-all duration-200">
        <div class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity" style="background:linear-gradient(135deg,${prj.color}08,transparent)"></div>
        <div class="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style="background:${prj.color}"></div>
        <div class="relative">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold" style="background:${prj.color}22;color:${prj.color}">${prj.code}</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase ${LA.projectTypeColor(prj.type)}">${LA.projectTypeLabel(prj.type)}</span>
              </div>
              <h3 class="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors">${prj.name}</h3>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0 ${LA.statusColor(prj.status)}">${LA.statusLabel(prj.status)}</span>
          </div>

          ${prj.description ? `<p class="text-xs text-dark-400 line-clamp-2 mb-3">${prj.description}</p>` : ''}

          <!-- Budget Bar -->
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] text-dark-400">Butce Kullanimi</span>
              <span class="text-[10px] text-dark-400">${LA.formatCurrency(prj.spent)} / ${LA.formatCurrency(prj.budget)}</span>
            </div>
            <div class="h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" style="width:${Math.min(budgetPct, 100)}%;background:${budgetColor}"></div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-4 gap-2 mb-3">
            <div class="text-center p-1.5 rounded-lg bg-dark-800/50">
              <p class="text-sm font-bold text-white">${s.experiments || 0}</p>
              <p class="text-[9px] text-dark-400">Deney</p>
            </div>
            <div class="text-center p-1.5 rounded-lg bg-dark-800/50">
              <p class="text-sm font-bold text-white">${s.workPackages || 0}</p>
              <p class="text-[9px] text-dark-400">IP</p>
            </div>
            <div class="text-center p-1.5 rounded-lg bg-dark-800/50">
              <p class="text-sm font-bold" style="color:${prj.color}">${s.wpProgress || 0}%</p>
              <p class="text-[9px] text-dark-400">Ilerleme</p>
            </div>
            <div class="text-center p-1.5 rounded-lg bg-dark-800/50">
              <p class="text-sm font-bold text-white">${s.labEntries || 0}</p>
              <p class="text-[9px] text-dark-400">Kayit</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-[10px] text-dark-400">
              ${prj.pi_name ? `<span>${prj.pi_name}</span>` : ''}
              ${prj.program ? `<span class="px-1.5 py-0.5 rounded bg-dark-800 text-dark-300">${prj.program}</span>` : ''}
            </div>
            <div class="flex gap-1">${tags.slice(0, 3).map(t => `<span class="px-1.5 py-0.5 rounded bg-dark-800 text-[9px] text-dark-300">${t}</span>`).join('')}</div>
          </div>
        </div>
      </a>`;
    }).join('');
  },

  showCreateModal() {
    document.getElementById('project-modal-title').textContent = 'Yeni Proje';
    document.getElementById('project-form').reset();
    document.getElementById('prj-id').value = '';
    document.getElementById('prj-color').value = '#06b6d4';
    LA.openModal('project-modal', 'project-modal-box');
  },

  async showEditModal(id) {
    try {
      const res = await LA.api.get('/projects/' + id);
      const prj = res.data;
      document.getElementById('project-modal-title').textContent = 'Proje Duzenle';
      document.getElementById('prj-id').value = prj.id;
      document.getElementById('prj-name').value = prj.name;
      document.getElementById('prj-code').value = prj.code;
      document.getElementById('prj-type').value = prj.type;
      document.getElementById('prj-description').value = prj.description || '';
      document.getElementById('prj-status').value = prj.status;
      document.getElementById('prj-program').value = prj.program || '';
      document.getElementById('prj-color').value = prj.color || '#06b6d4';
      document.getElementById('prj-start').value = prj.start_date || '';
      document.getElementById('prj-end').value = prj.end_date || '';
      document.getElementById('prj-budget').value = prj.budget || 0;
      document.getElementById('prj-spent').value = prj.spent || 0;
      document.getElementById('prj-pi').value = prj.pi_name || '';
      document.getElementById('prj-institution').value = prj.institution || '';
      document.getElementById('prj-tags').value = LA.parseJSON(prj.tags).join(', ');
      LA.openModal('project-modal', 'project-modal-box');
    } catch (err) { LA.toast('Proje yuklenemedi', 'error'); }
  },

  closeModal() {
    LA.closeModal('project-modal', 'project-modal-box');
  },

  async handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prj-id').value;
    const tagsStr = document.getElementById('prj-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      name: document.getElementById('prj-name').value,
      code: document.getElementById('prj-code').value,
      type: document.getElementById('prj-type').value,
      description: document.getElementById('prj-description').value,
      status: document.getElementById('prj-status').value,
      program: document.getElementById('prj-program').value || null,
      color: document.getElementById('prj-color').value,
      start_date: document.getElementById('prj-start').value || null,
      end_date: document.getElementById('prj-end').value || null,
      budget: parseFloat(document.getElementById('prj-budget').value) || 0,
      spent: parseFloat(document.getElementById('prj-spent').value) || 0,
      pi_name: document.getElementById('prj-pi').value || null,
      institution: document.getElementById('prj-institution').value || null,
      tags
    };

    try {
      if (id) {
        await LA.api.put('/projects/' + id, data);
        LA.toast('Proje guncellendi', 'success');
      } else {
        await LA.api.post('/projects', data);
        LA.toast('Proje olusturuldu', 'success');
      }
      this.closeModal();
      this.loadProjects();
      LA.loadProjectsForFilter();
    } catch (err) { LA.toast(err.message, 'error'); }
  }
};

PrjPage.init();
