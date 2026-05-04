// === Dashboard Page ===
const DashPage = {
  charts: {},

  async init() {
    await this.loadData();
    // Listen for global project filter changes
    window._onProjectFilterChange = () => this.loadData();
  },

  async loadData() {
    try {
      const pid = LA.getGlobalProjectId();
      const params = pid ? `?project_id=${pid}` : '';
      const res = await LA.api.get('/dashboard/summary' + params);
      const d = res.data;

      // Stats cards
      document.getElementById('stat-active-exp').textContent = d.experiments.active;
      document.getElementById('stat-total-exp').textContent = d.experiments.total;
      document.getElementById('stat-wp-progress').textContent = d.workPackages.overallProgress + '%';
      document.getElementById('stat-wp-count').textContent = d.workPackages.total;
      document.getElementById('stat-today-events').textContent = d.calendar.today.length;
      document.getElementById('stat-upcoming').textContent = d.calendar.upcoming.length;
      document.getElementById('stat-low-stock').textContent = d.materials.lowStockCount;

      // Notification badge
      const alertCount = d.materials.lowStockCount + d.equipment.maintenanceDue.length;
      const badge = document.getElementById('notif-badge');
      if (alertCount > 0) {
        badge.textContent = alertCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }

      // Project cards (if not filtered to single project)
      this.renderProjectCards(d.projects || []);

      // Work Package Progress
      const wpEl = document.getElementById('wp-progress-list');
      if (d.workPackages.items.length) {
        const statusColors = { planned: '#627d98', in_progress: '#3b82f6', completed: '#22c55e', delayed: '#f97316', cancelled: '#6b7280' };
        wpEl.innerHTML = d.workPackages.items.map(wp => `
          <div class="flex items-center gap-4">
            <span class="text-xs font-mono font-bold text-accent-400 w-10">${wp.number}</span>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-white truncate">${wp.title}</span>
                <span class="text-xs text-dark-400 ml-2">${wp.progress}%</span>
              </div>
              <div class="h-2 bg-dark-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="width:${wp.progress}%;background:${statusColors[wp.status] || '#3b82f6'}"></div>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        wpEl.innerHTML = '<p class="text-sm text-dark-400 text-center py-4">Henuz is paketi yok</p>';
      }

      // Upcoming Events
      const evEl = document.getElementById('upcoming-events-list');
      if (d.calendar.upcoming.length) {
        const typeColors = { experiment: 'border-blue-500', meeting: 'border-purple-500', deadline: 'border-red-500', maintenance: 'border-orange-500', review: 'border-green-500' };
        evEl.innerHTML = d.calendar.upcoming.map(ev => `
          <div class="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border-l-2 ${typeColors[ev.event_type] || 'border-gray-500'}">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-white truncate">${ev.title}</p>
              <p class="text-[10px] text-dark-400 mt-0.5">${LA.formatDateTime(ev.start_datetime)}</p>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${LA.eventTypeColor(ev.event_type)}">${LA.eventTypeLabel(ev.event_type)}</span>
          </div>
        `).join('');
      } else {
        evEl.innerHTML = '<p class="text-sm text-dark-400 text-center py-4">Yaklasan etkinlik yok</p>';
      }

      // Recent Lab Entries
      const entEl = document.getElementById('recent-entries-list');
      if (d.recentActivity.length) {
        entEl.innerHTML = d.recentActivity.map(e => `
          <div class="flex gap-3 p-3 rounded-xl bg-dark-800/50 fade-in">
            <div class="w-8 h-8 rounded-lg ${LA.categoryColor(e.category)} flex items-center justify-center flex-shrink-0">${LA.categoryIcon(e.category)}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-white">${e.author}</span>
                <span class="text-[10px] text-dark-400">${LA.formatDateTime(e.created_at)}</span>
              </div>
              <p class="text-xs text-gray-400 line-clamp-2">${e.content}</p>
              ${e.experiment_title ? `<span class="inline-block mt-1 text-[10px] text-accent-400">${e.experiment_title}</span>` : ''}
            </div>
          </div>
        `).join('');
      } else {
        entEl.innerHTML = '<p class="text-sm text-dark-400 text-center py-4">Henuz kayit yok</p>';
      }

      // Alerts
      const alertEl = document.getElementById('alerts-list');
      let alertsHTML = '';
      d.equipment.maintenanceDue.forEach(eq => {
        alertsHTML += `
          <div class="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <svg class="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-white truncate">${eq.name}</p>
              <p class="text-[10px] text-orange-400">Bakim: ${LA.formatDate(eq.next_maintenance)}</p>
            </div>
          </div>`;
      });
      d.materials.lowStock.forEach(m => {
        alertsHTML += `
          <div class="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-white truncate">${m.name}</p>
              <p class="text-[10px] text-amber-400">${m.quantity} ${m.unit} (min: ${m.min_threshold})</p>
            </div>
          </div>`;
      });
      alertEl.innerHTML = alertsHTML || '<p class="text-sm text-dark-400 text-center py-4">Uyari yok</p>';

      // Charts
      this.renderCharts(d);

    } catch (err) {
      console.error('Dashboard yuklenemedi:', err);
      LA.toast('Dashboard verileri yuklenemedi', 'error');
    }
  },

  renderProjectCards(projects) {
    const el = document.getElementById('dashboard-projects');
    if (!el) return;
    if (!projects.length) {
      el.innerHTML = '<p class="text-sm text-dark-400 text-center py-4">Proje bulunamadi</p>';
      return;
    }
    el.innerHTML = projects.slice(0, 4).map(prj => {
      const s = prj.stats || {};
      const budgetPct = prj.budget > 0 ? Math.round((prj.spent / prj.budget) * 100) : 0;
      return `
      <a href="/projects/${prj.id}" class="block group rounded-2xl bg-dark-900/80 border border-dark-700/50 p-4 hover:border-dark-600/50 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1" style="background:${prj.color}"></div>
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold" style="background:${prj.color}22;color:${prj.color}">${prj.code}</span>
            <h4 class="text-xs font-semibold text-white mt-1 group-hover:text-accent-400 transition-colors">${prj.name}</h4>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-medium ${LA.statusColor(prj.status)}">${LA.statusLabel(prj.status)}</span>
        </div>
        <div class="flex items-center justify-between text-[10px] text-dark-400 mt-2">
          <span>${s.experiments || 0} deney</span>
          <span>${s.wpProgress || 0}% IP</span>
          <span>%${budgetPct} butce</span>
        </div>
      </a>`;
    }).join('');
  },

  renderCharts(d) {
    Chart.defaults.color = '#627d98';
    Chart.defaults.borderColor = 'rgba(51,78,104,0.2)';

    // Destroy existing charts
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};

    // Experiment Status Doughnut
    const statusMap = {};
    d.experiments.byStatus.forEach(s => { statusMap[s.status] = s.count; });
    const statusLabels = ['Planli', 'Devam Ediyor', 'Tamamlandi', 'Basarisiz', 'Beklemede'];
    const statusKeys = ['planned', 'in_progress', 'completed', 'failed', 'on_hold'];
    const statusChartColors = ['#627d98', '#3b82f6', '#22c55e', '#ef4444', '#eab308'];

    this.charts.status = new Chart(document.getElementById('chart-exp-status'), {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{ data: statusKeys.map(k => statusMap[k] || 0), backgroundColor: statusChartColors, borderWidth: 0, hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } }
        }
      }
    });

    // Monthly Activity Bar
    const months = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const now = new Date();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push(months[m.getMonth()]);
    }

    this.charts.monthly = new Chart(document.getElementById('chart-monthly'), {
      type: 'bar',
      data: {
        labels: last6,
        datasets: [
          { label: 'Deneyler', data: [3, 5, 4, 6, 4, d.experiments.total], backgroundColor: 'rgba(59,130,246,0.6)', borderRadius: 6, barPercentage: 0.5 },
          { label: 'Lab Kayitlari', data: [8, 12, 10, 15, 11, d.recentActivity.length], backgroundColor: 'rgba(39,171,131,0.6)', borderRadius: 6, barPercentage: 0.5 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(51,78,104,0.15)' } }, x: { grid: { display: false } } },
        plugins: { legend: { labels: { usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } } }
      }
    });
  }
};

DashPage.init();
