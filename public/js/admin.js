const AdminPage = {
  users: [],
  allProjects: [],
  resetRequests: [],
  currentUserId: null,

  async init() {
    await Promise.all([this.loadUsers(), this.loadProjects(), this.loadResetRequests()]);
    this.render();
    this.renderResetRequests();
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

  async loadResetRequests() {
    const res = await LA.api.get('/users/reset-requests');
    if (res.success) this.resetRequests = res.data;
  },

  renderResetRequests() {
    const section = document.getElementById('reset-requests-section');
    const list = document.getElementById('reset-requests-list');
    if (!this.resetRequests || this.resetRequests.length === 0) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    list.innerHTML = this.resetRequests.map(r => `
      <div class="flex items-center justify-between bg-dark-900/60 rounded-xl p-3">
        <div>
          <span class="text-sm text-white font-medium">${r.username}</span>
          <span class="text-xs text-dark-400 ml-2">${r.created_at}</span>
        </div>
        <div class="flex gap-2">
          <button onclick="AdminPage.openResetModal(${r.user_id}, '${r.username}', ${r.id})" class="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-colors">Sifreyi Sifirla</button>
          <button onclick="AdminPage.dismissReset(${r.id})" class="px-3 py-1 rounded-lg bg-dark-800 text-dark-400 border border-dark-700 text-xs hover:bg-dark-700 transition-colors">Kapat</button>
        </div>
      </div>
    `).join('');
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
          <div class="flex items-center gap-2">
            <button onclick="AdminPage.openResetModal(${u.id}, '${u.display_name}')" class="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors text-xs font-medium" title="Sifre Sifirla">
              <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              Sifre
            </button>
            ${u.role !== 'admin' ? `
              <button onclick="AdminPage.openAssignModal(${u.id}, '${u.display_name}')" class="px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-400 border border-accent-500/20 hover:bg-accent-500/20 transition-colors text-xs font-medium">+ Proje</button>
              <button onclick="AdminPage.deleteUser(${u.id}, '${u.display_name}')" class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs font-medium" title="Kullaniciyi Sil">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            ` : '<span class="text-xs text-amber-400/60 px-3 py-1.5">Tum projelere erisim</span>'}
          </div>
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
              <button onclick="AdminPage.unassign(${u.id}, ${p.project_id})" class="ml-1 text-red-400 hover:text-red-300">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  // --- Create User ---
  openCreateUserModal() {
    document.getElementById('new-user-display').value = '';
    document.getElementById('new-user-username').value = '';
    document.getElementById('new-user-password').value = '';
    document.getElementById('new-user-role').value = 'user';
    const modal = document.getElementById('create-user-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('new-user-display').focus();
  },
  closeCreateUserModal() {
    const modal = document.getElementById('create-user-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },
  async createUser() {
    const display_name = document.getElementById('new-user-display').value.trim();
    const username = document.getElementById('new-user-username').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;
    if (!display_name || !username || !password) return LA.toast.warning('Tum alanlar zorunludur');
    if (password.length < 4) return LA.toast.warning('Sifre en az 4 karakter olmalidir');
    const res = await LA.api.post('/users', { display_name, username, password, role });
    if (res.success) {
      LA.toast.success(res.message);
      this.closeCreateUserModal();
      await this.loadUsers();
      this.render();
    } else {
      LA.toast.error(res.message);
    }
  },

  // --- Reset Password ---
  openResetModal(userId, displayName, requestId) {
    this.currentUserId = userId;
    this.currentResetRequestId = requestId || null;
    document.getElementById('reset-user-name').textContent = displayName;
    document.getElementById('reset-new-password').value = '';
    const modal = document.getElementById('reset-password-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('reset-new-password').focus();
  },
  closeResetModal() {
    const modal = document.getElementById('reset-password-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.currentUserId = null;
    this.currentResetRequestId = null;
  },
  async resetPassword() {
    const password = document.getElementById('reset-new-password').value;
    if (!password || password.length < 4) return LA.toast.warning('Sifre en az 4 karakter olmalidir');
    const res = await LA.api.post(`/users/${this.currentUserId}/reset-password`, { password });
    if (res.success) {
      LA.toast.success(res.message);
      if (this.currentResetRequestId) {
        await LA.api.post(`/users/reset-requests/${this.currentResetRequestId}/done`);
        await this.loadResetRequests();
        this.renderResetRequests();
      }
      this.closeResetModal();
    } else {
      LA.toast.error(res.message);
    }
  },

  async dismissReset(requestId) {
    await LA.api.post(`/users/reset-requests/${requestId}/done`);
    await this.loadResetRequests();
    this.renderResetRequests();
  },

  // --- Delete User ---
  async deleteUser(userId, displayName) {
    if (!confirm(`"${displayName}" kullanicisini silmek istediginize emin misiniz?`)) return;
    const res = await LA.api.del(`/users/${userId}`);
    if (res.success) {
      LA.toast.success(res.message);
      await this.loadUsers();
      this.render();
    } else {
      LA.toast.error(res.message);
    }
  },

  // --- Assign Project ---
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
