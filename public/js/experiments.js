// === Experiments Page ===
const ExpPage = {
  currentView: 'list',
  experiments: [],

  async init() {
    await this.loadExperiments();
    this.bindEvents();
    window._onProjectFilterChange = () => this.loadExperiments();
  },

  bindEvents() {
    document.getElementById('filter-status').addEventListener('change', () => this.loadExperiments());
    document.getElementById('filter-priority').addEventListener('change', () => this.loadExperiments());
    document.getElementById('filter-search').addEventListener('input', LA.debounce(() => this.loadExperiments(), 300));
    document.getElementById('view-list-btn').addEventListener('click', () => this.setView('list'));
    document.getElementById('view-kanban-btn').addEventListener('click', () => this.setView('kanban'));
    document.getElementById('experiment-form').addEventListener('submit', (e) => this.handleSubmit(e));
  },

  async loadExperiments() {
    try {
      const params = new URLSearchParams();
      const status = document.getElementById('filter-status').value;
      const priority = document.getElementById('filter-priority').value;
      const search = document.getElementById('filter-search').value;
      const pid = LA.getGlobalProjectId();
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (search) params.set('search', search);
      if (pid) params.set('project_id', pid);

      const res = await LA.api.get('/experiments?' + params.toString());
      this.experiments = res.data;
      this.render();
    } catch (err) {
      LA.toast('Deneyler yuklenemedi', 'error');
    }
  },

  render() {
    if (this.currentView === 'list') this.renderList();
    else this.renderKanban();
  },

  renderList() {
    const el = document.getElementById('experiments-list-view');
    if (!this.experiments.length) {
      el.innerHTML = '<div class="text-center py-12 text-dark-400"><p class="text-sm">Henuz deney bulunamadi</p></div>';
      return;
    }
    el.innerHTML = this.experiments.map(exp => {
      const tags = LA.parseJSON(exp.tags);
      return `
      <a href="/experiments/${exp.id}" class="block group relative overflow-hidden rounded-2xl bg-dark-900/80 border border-dark-700/50 p-5 hover:border-dark-600/50 hover:-translate-y-0.5 transition-all duration-200">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                ${exp.project_code ? LA.projectBadge(exp.project_code, exp.project_color) : ''}
                <h3 class="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors truncate">${exp.title}</h3>
              </div>
              <p class="text-xs text-dark-400 mt-1 line-clamp-2">${exp.hypothesis || 'Hipotez belirtilmemis'}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-medium ${LA.statusColor(exp.status)}">${LA.statusLabel(exp.status)}</span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-medium ${LA.priorityColor(exp.priority)}">${LA.priorityLabel(exp.priority)}</span>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-3 text-[10px] text-dark-400">
              ${exp.researcher ? `<span>${exp.researcher}</span>` : ''}
              <span>${LA.formatDate(exp.start_date)} - ${LA.formatDate(exp.end_date)}</span>
            </div>
            <div class="flex gap-1">${tags.map(t => `<span class="px-2 py-0.5 rounded-full bg-dark-800 text-[10px] text-dark-300">${t}</span>`).join('')}</div>
          </div>
        </div>
      </a>`;
    }).join('');
  },

  renderKanban() {
    const statuses = ['planned', 'in_progress', 'completed', 'failed', 'on_hold'];
    statuses.forEach(status => {
      const items = this.experiments.filter(e => e.status === status);
      const el = document.getElementById('kanban-' + status);
      const countEl = document.getElementById('kanban-count-' + status);
      countEl.textContent = items.length;

      el.innerHTML = items.map(exp => `
        <div class="kanban-card rounded-xl bg-dark-900 border border-dark-700/50 p-3 hover:border-dark-600/50 transition-all cursor-pointer" draggable="true" data-id="${exp.id}" data-status="${exp.status}" onclick="window.location='/experiments/${exp.id}'">
          ${exp.project_code ? `<div class="mb-1.5">${LA.projectBadge(exp.project_code, exp.project_color)}</div>` : ''}
          <h4 class="text-xs font-medium text-white mb-1.5 line-clamp-2">${exp.title}</h4>
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-medium ${LA.priorityColor(exp.priority)}">${LA.priorityLabel(exp.priority)}</span>
            <span class="text-[10px] text-dark-400">${exp.researcher || ''}</span>
          </div>
        </div>
      `).join('') || '<p class="text-xs text-dark-500 text-center py-4">Bos</p>';

      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop-target'); });
      el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
      el.addEventListener('drop', async (e) => {
        e.preventDefault();
        el.classList.remove('drop-target');
        const id = e.dataTransfer.getData('text/plain');
        if (id) {
          try {
            await LA.api.put('/experiments/' + id, { status });
            LA.toast('Deney durumu guncellendi', 'success');
            this.loadExperiments();
          } catch (err) { LA.toast('Guncelleme hatasi', 'error'); }
        }
      });
    });

    document.querySelectorAll('.kanban-card[draggable]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });
  },

  setView(view) {
    this.currentView = view;
    const listBtn = document.getElementById('view-list-btn');
    const kanbanBtn = document.getElementById('view-kanban-btn');
    const listView = document.getElementById('experiments-list-view');
    const kanbanView = document.getElementById('experiments-kanban-view');

    if (view === 'list') {
      listBtn.className = 'p-2 rounded-lg bg-accent-500/10 border border-accent-500/20 text-accent-400 transition-colors';
      kanbanBtn.className = 'p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white transition-colors';
      listView.classList.remove('hidden');
      kanbanView.classList.add('hidden');
    } else {
      kanbanBtn.className = 'p-2 rounded-lg bg-accent-500/10 border border-accent-500/20 text-accent-400 transition-colors';
      listBtn.className = 'p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-400 hover:text-white transition-colors';
      kanbanView.classList.remove('hidden');
      listView.classList.add('hidden');
    }
    this.render();
  },

  showCreateModal() {
    document.getElementById('experiment-modal-title').textContent = 'Yeni Deney';
    document.getElementById('experiment-form').reset();
    document.getElementById('exp-id').value = '';
    LA.populateProjectSelect('exp-project', LA.getGlobalProjectId());
    LA.openModal('experiment-modal', 'experiment-modal-box');
  },

  showEditModal(exp) {
    document.getElementById('experiment-modal-title').textContent = 'Deney Duzenle';
    document.getElementById('exp-id').value = exp.id;
    document.getElementById('exp-title').value = exp.title || '';
    document.getElementById('exp-hypothesis').value = exp.hypothesis || '';
    document.getElementById('exp-methodology').value = exp.methodology || '';
    document.getElementById('exp-status').value = exp.status;
    document.getElementById('exp-priority').value = exp.priority;
    document.getElementById('exp-start').value = exp.start_date || '';
    document.getElementById('exp-end').value = exp.end_date || '';
    document.getElementById('exp-researcher').value = exp.researcher || '';
    document.getElementById('exp-results').value = exp.results || '';
    document.getElementById('exp-observations').value = exp.observations || '';
    document.getElementById('exp-tags').value = LA.parseJSON(exp.tags).join(', ');
    LA.populateProjectSelect('exp-project', exp.project_id || '');
    LA.openModal('experiment-modal', 'experiment-modal-box');
  },

  closeModal() {
    LA.closeModal('experiment-modal', 'experiment-modal-box');
  },

  async handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('exp-id').value;
    const tagsStr = document.getElementById('exp-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const projSel = document.getElementById('exp-project');

    const data = {
      title: document.getElementById('exp-title').value,
      hypothesis: document.getElementById('exp-hypothesis').value,
      methodology: document.getElementById('exp-methodology').value,
      status: document.getElementById('exp-status').value,
      priority: document.getElementById('exp-priority').value,
      start_date: document.getElementById('exp-start').value || null,
      end_date: document.getElementById('exp-end').value || null,
      researcher: document.getElementById('exp-researcher').value,
      results: document.getElementById('exp-results').value,
      observations: document.getElementById('exp-observations').value,
      project_id: projSel ? (projSel.value || null) : null,
      tags
    };

    try {
      if (id) {
        await LA.api.put('/experiments/' + id, data);
        LA.toast('Deney guncellendi', 'success');
      } else {
        await LA.api.post('/experiments', data);
        LA.toast('Deney olusturuldu', 'success');
      }
      this.closeModal();
      this.loadExperiments();
    } catch (err) {
      LA.toast(err.message, 'error');
    }
  }
};

ExpPage.init();
