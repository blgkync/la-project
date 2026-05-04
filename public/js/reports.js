// === Reports Page ===
const RptPage = {
  charts: {},

  init() {
    this.generate();
    window._onProjectFilterChange = () => this.generate();
  },

  async generate() {
    try {
      const startDate = document.getElementById('rpt-start').value;
      const endDate = document.getElementById('rpt-end').value;
      const pid = LA.getGlobalProjectId();
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (pid) params.set('project_id', pid);

      const res = await LA.api.get('/reports/generate?' + params.toString());
      const d = res.data;

      // Summary stats
      document.getElementById('rpt-exp-total').textContent = d.experiments.total;
      document.getElementById('rpt-wp-progress').textContent = d.workPackages.overallProgress + '%';
      document.getElementById('rpt-entries-total').textContent = d.labEntries.total;
      document.getElementById('rpt-budget').textContent = LA.formatCurrency(d.workPackages.totalBudget);

      // Experiments table
      const expTable = document.getElementById('rpt-exp-table');
      expTable.innerHTML = d.experiments.items.map(exp => `
        <tr class="border-b border-dark-700/30">
          <td class="py-2 px-3 text-xs text-white">${exp.title}</td>
          <td class="py-2 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${LA.statusColor(exp.status)}">${LA.statusLabel(exp.status)}</span></td>
          <td class="py-2 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${LA.priorityColor(exp.priority)}">${LA.priorityLabel(exp.priority)}</span></td>
          <td class="py-2 px-3 text-xs text-gray-300">${exp.researcher || '-'}</td>
          <td class="py-2 px-3 text-xs text-gray-300">${LA.formatDate(exp.start_date)}</td>
        </tr>
      `).join('');

      // Work packages table
      const wpTable = document.getElementById('rpt-wp-table');
      wpTable.innerHTML = d.workPackages.items.map(wp => `
        <tr class="border-b border-dark-700/30">
          <td class="py-2 px-3 text-xs font-mono text-accent-400">${wp.number}</td>
          <td class="py-2 px-3 text-xs text-white">${wp.title}</td>
          <td class="py-2 px-3">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden"><div class="h-full bg-accent-500 rounded-full" style="width:${wp.progress}%"></div></div>
              <span class="text-xs text-dark-400">${wp.progress}%</span>
            </div>
          </td>
          <td class="py-2 px-3 text-xs text-gray-300">${LA.formatCurrency(wp.budget)}</td>
          <td class="py-2 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${LA.statusColor(wp.status)}">${LA.statusLabel(wp.status)}</span></td>
        </tr>
      `).join('');

      // Low stock
      const lowStockEl = document.getElementById('rpt-low-stock');
      if (d.materials.lowStockItems.length) {
        lowStockEl.innerHTML = d.materials.lowStockItems.map(m => `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
            <span class="text-xs text-white">${m.name}</span>
            <span class="text-xs text-red-400 font-medium">${m.quantity} / ${m.min_threshold} ${m.unit}</span>
          </div>
        `).join('');
      } else {
        lowStockEl.innerHTML = '<p class="text-sm text-dark-400 text-center py-4">Dusuk stok yok</p>';
      }

      // Charts
      Chart.defaults.color = '#627d98';
      Chart.defaults.borderColor = 'rgba(51,78,104,0.2)';

      // Destroy existing charts
      Object.values(this.charts).forEach(c => c.destroy());

      // Status chart
      const statusData = d.experiments.byStatus;
      const statusLabels = { planned: 'Planli', in_progress: 'Devam Ediyor', completed: 'Tamamlandi', failed: 'Basarisiz', on_hold: 'Beklemede' };
      const statusColors = { planned: '#627d98', in_progress: '#3b82f6', completed: '#22c55e', failed: '#ef4444', on_hold: '#eab308' };

      this.charts.status = new Chart(document.getElementById('rpt-chart-status'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusData).map(k => statusLabels[k] || k),
          datasets: [{ data: Object.values(statusData), backgroundColor: Object.keys(statusData).map(k => statusColors[k] || '#627d98'), borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 11 } } } } }
      });

      // Priority chart
      const priData = d.experiments.byPriority;
      const priLabels = { low: 'Dusuk', medium: 'Orta', high: 'Yuksek', critical: 'Kritik' };
      const priColors = { low: '#627d98', medium: '#3b82f6', high: '#f97316', critical: '#ef4444' };

      this.charts.priority = new Chart(document.getElementById('rpt-chart-priority'), {
        type: 'bar',
        data: {
          labels: Object.keys(priData).map(k => priLabels[k] || k),
          datasets: [{ label: 'Deney Sayisi', data: Object.values(priData), backgroundColor: Object.keys(priData).map(k => priColors[k] || '#627d98'), borderRadius: 6, barPercentage: 0.5 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
      });

    } catch (err) {
      LA.toast('Rapor olusturulamadi', 'error');
      console.error(err);
    }
  },

  print() {
    window.print();
  }
};

RptPage.init();
