const AdminPage = {
  users: [],
  allProjects: [],
  currentUserId: null,

  async init() {
    await Promise.all([this.loadUsers(), this.loadProjects()]);
    this.render();
    document.getElementById('admin-loading').classList.add('hidden');
    document.getElementById('admin-content').classList.remove('hidden');
  },

  async loadUsers() {
    const res = await LA.api.get('/users');
    if (res.success) this.users = res.data;
  },

  async loadProjects() {
    const res = await LA.api.get('/projects/active');
    if (res.success) this.allProjects = res.data;
  },

  render() {
    const container = document.getElementById('admin-content');
    container.innerHTML = this.users.map(u => `
      <div class="bg-dark-900/60 border border-dark-700/50 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${u.role === 'admin' ? 'from-amber-500 to-orange-600' : 'from-blue-500 to-purple-600'} flex items-center justify-center text-white text-sm font-bold">
              ${u.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 class="text-sm font-semibold text-white">${u.display_name}</h3>
              <p class="text-xs text-dark-400">@${u.username} · ${u.role === 'admin' ? 'Yonetici' : 'Ekip Uyesi'}</p>
            </div>
          </div>
          ${u.role !== 'admin' ? `
            <button onclick="AdminPage.openAssignModal(${u.id}, '${u.display_name}')" class="px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-400 border border-accent-500/20 hover:bg-accent-500/20 transition-colors text-xs font-medium">
              + Proje Ata
            </button>
          ` : '<span class="text-xs text-amber-400/60 px-3 py-1.5">Tum projelere erisim</span>'}
        </div>
        <div class="flex flex-wrap gap-2">
          ${u.projects.length === 0 && u.role !== 'admin' ? '<span class="text-xs text-dark-500 italic">Henuz proje atanmadi</span>' : ''}
          ${u.role === 'admin' ? this.allProjects.map(p => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-dark-800/60 border border-dark-700/50 text-dark-300">
              <span class="w-2 h-2 rounded-full" style="background:${p.color || '#06b6d4'}"></span>
              ${p.code} - ${p.name}
            </span>
          `).join('') : u.projects.map(p => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-accent-500/10 border border-accent-500/20 text-accent-400">
              <span class="w-2 h-2 rounded-full" style="background:${p.project_color || '#06b6d4'}"></span>
              ${p.project_code} - ${p.project_name}
              <button onclick="AdminPage.unassign(${u.id}, ${p.project_id})" class="ml-1 text-red-400 hover:text-red-300" title="Kaldır">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  openAssignModal(userId, userName) {
    this.currentUserId = userId;
    document.getElementById('assign-user-name').textContent = userName;
    const user = this.users.find(u => u.id === userId);
    const assignedIds = user ? user.projects.map(p => p.project_id) : [];
    const select = document.getElementById('assign-project-select');
    select.innerHTML = '<option value="">Proje secin...</option>' +
      this.allProjects.filter(p => !assignedIds.includes(p.id)).map(p =>
        `<option value="${p.id}">${p.code} - ${p.name}</option>`
      ).join('');
    const modal = document.getElementById('assign-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeAssignModal() {
    const modal = document.getElementById('assign-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.currentUserId = null;
  },

  async assignProject() {
    const projectId = document.getElementById('assign-project-select').value;
    if (!projectId) return LA.toast.warning('Bir proje secin');
    const res = await LA.api.post(`/users/${this.currentUserId}/projects`, { project_id: parseInt(projectId) });
    if (res.success) {
      LA.toast.success(res.message);
      this.closeAssignModal();
      await this.loadUsers();
      this.render();
    }
  },

  async unassign(userId, projectId) {
    const res = await LA.api.del(`/users/${userId}/projects/${projectId}`);
    if (res.success) {
      LA.toast.success(res.message);
      await this.loadUsers();
      this.render();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => AdminPage.init());
