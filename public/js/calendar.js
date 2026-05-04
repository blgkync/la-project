// === Calendar Page ===
const CalPage = {
  currentDate: new Date(),
  currentView: 'month',
  events: [],

  async init() {
    this.bindEvents();
    await this.loadEvents();
    window._onProjectFilterChange = () => this.loadEvents();
  },

  bindEvents() {
    document.getElementById('event-form').addEventListener('submit', (e) => this.handleSubmit(e));
  },

  async loadEvents() {
    try {
      const y = this.currentDate.getFullYear();
      const m = this.currentDate.getMonth() + 1;
      const pid = LA.getGlobalProjectId();
      const extra = pid ? `&project_id=${pid}` : '';
      const res = await LA.api.get(`/calendar?year=${y}&month=${m}${extra}`);
      this.events = res.data;
      this.render();
    } catch (err) {
      LA.toast('Etkinlikler yuklenemedi', 'error');
    }
  },

  render() {
    this.updateTitle();
    if (this.currentView === 'month') this.renderMonth();
    else if (this.currentView === 'week') this.renderWeek();
    else this.renderDay();
  },

  updateTitle() {
    const months = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
    document.getElementById('calendar-title').textContent = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  },

  renderMonth() {
    const container = document.getElementById('calendar-container');
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start
    const totalDays = lastDay.getDate();
    const today = new Date();

    const dayNames = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];
    let html = '<div class="grid grid-cols-7">';

    // Day headers
    dayNames.forEach(d => {
      html += `<div class="py-2 px-2 text-center text-[10px] font-semibold text-dark-400 uppercase tracking-wider border-b border-dark-700/50">${d}</div>`;
    });

    // Previous month days
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLast - i;
      html += `<div class="cal-day other-month border-b border-r border-dark-700/30 p-1.5"><span class="text-[10px] text-dark-500">${day}</span></div>`;
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      const dayEvents = this.events.filter(ev => ev.start_datetime && ev.start_datetime.startsWith(dateStr));

      html += `<div class="cal-day ${isToday ? 'today' : ''} border-b border-r border-dark-700/30 p-1.5 cursor-pointer" onclick="CalPage.onDayClick('${dateStr}')">`;
      html += `<div class="flex items-center justify-between mb-1">
        <span class="text-[10px] ${isToday ? 'w-5 h-5 rounded-full bg-accent-500 text-white flex items-center justify-center font-bold' : 'text-dark-300'}">${d}</span>
      </div>`;

      dayEvents.forEach(ev => {
        const bgColor = ev.color ? `background:${ev.color}33;color:${ev.color}` : '';
        html += `<div class="cal-event" style="${bgColor}" onclick="event.stopPropagation();CalPage.showEventDetail(${ev.id})" title="${ev.title}">${ev.title}</div>`;
      });
      html += '</div>';
    }

    // Fill remaining cells
    const totalCells = startDay + totalDays;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="cal-day other-month border-b border-r border-dark-700/30 p-1.5"><span class="text-[10px] text-dark-500">${i}</span></div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  },

  renderWeek() {
    const container = document.getElementById('calendar-container');
    const curr = new Date(this.currentDate);
    const dayOfWeek = curr.getDay() === 0 ? 6 : curr.getDay() - 1;
    const weekStart = new Date(curr);
    weekStart.setDate(curr.getDate() - dayOfWeek);

    const dayNames = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];
    const today = new Date();
    const hours = [];
    for (let h = 7; h <= 20; h++) hours.push(h);

    let html = '<div class="overflow-auto"><table class="w-full"><thead><tr><th class="w-14"></th>';
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      html += `<th class="py-2 px-1 text-center border-b border-dark-700/50 ${isToday ? 'bg-accent-500/5' : ''}">
        <div class="text-[10px] text-dark-400">${dayNames[i]}</div>
        <div class="text-sm ${isToday ? 'text-accent-400 font-bold' : 'text-white'}">${d.getDate()}</div>
      </th>`;
    }
    html += '</tr></thead><tbody>';

    hours.forEach(h => {
      html += `<tr><td class="time-label py-2 border-r border-dark-700/30">${String(h).padStart(2, '0')}:00</td>`;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const hourEvents = this.events.filter(ev => {
          if (!ev.start_datetime) return false;
          const evDate = ev.start_datetime.slice(0, 10);
          const evHour = parseInt(ev.start_datetime.slice(11, 13));
          return evDate === dateStr && evHour === h;
        });

        html += `<td class="time-slot border-r border-dark-700/30 p-1 align-top">`;
        hourEvents.forEach(ev => {
          html += `<div class="cal-event rounded px-1.5 py-0.5 mb-0.5" style="background:${ev.color || '#3b82f6'}33;color:${ev.color || '#3b82f6'}" onclick="CalPage.showEventDetail(${ev.id})">${ev.title}</div>`;
        });
        html += '</td>';
      }
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  },

  renderDay() {
    const container = document.getElementById('calendar-container');
    const dateStr = this.currentDate.toISOString().slice(0, 10);
    const dayEvents = this.events.filter(ev => ev.start_datetime && ev.start_datetime.startsWith(dateStr));
    const hours = [];
    for (let h = 7; h <= 20; h++) hours.push(h);

    let html = '<div class="p-4"><h3 class="text-sm font-semibold text-white mb-4">' +
      this.currentDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      '</h3><div class="space-y-0">';

    hours.forEach(h => {
      const hourEvents = dayEvents.filter(ev => parseInt(ev.start_datetime.slice(11, 13)) === h);
      html += `<div class="flex time-slot py-2">
        <div class="time-label pt-1">${String(h).padStart(2, '0')}:00</div>
        <div class="flex-1 pl-3 space-y-1">`;
      hourEvents.forEach(ev => {
        html += `<div class="cal-event rounded-lg px-3 py-2 cursor-pointer" style="background:${ev.color || '#3b82f6'}22;border-left:3px solid ${ev.color || '#3b82f6'}" onclick="CalPage.showEventDetail(${ev.id})">
          <div class="text-xs font-medium text-white">${ev.title}</div>
          <div class="text-[10px] text-dark-400">${ev.description || ''}</div>
        </div>`;
      });
      html += '</div></div>';
    });

    html += '</div></div>';
    container.innerHTML = html;
  },

  prevMonth() {
    if (this.currentView === 'month') this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    else if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() - 7);
    else this.currentDate.setDate(this.currentDate.getDate() - 1);
    this.loadEvents();
  },

  nextMonth() {
    if (this.currentView === 'month') this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    else if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() + 7);
    else this.currentDate.setDate(this.currentDate.getDate() + 1);
    this.loadEvents();
  },

  goToday() {
    this.currentDate = new Date();
    this.loadEvents();
  },

  setView(view) {
    this.currentView = view;
    ['month', 'week', 'day'].forEach(v => {
      const btn = document.getElementById('view-' + v + '-btn');
      if (v === view) btn.className = 'px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-accent-500/10 text-accent-400';
      else btn.className = 'px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-dark-400 hover:text-white';
    });
    this.render();
  },

  onDayClick(dateStr) {
    document.getElementById('event-start').value = dateStr + 'T09:00';
    document.getElementById('event-end').value = dateStr + 'T10:00';
    this.showCreateModal();
  },

  showCreateModal() {
    document.getElementById('event-modal-title').textContent = 'Yeni Etkinlik';
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
    LA.populateProjectSelect('event-project', LA.getGlobalProjectId());
    LA.openModal('event-modal', 'event-modal-box');
  },

  showEditModal(ev) {
    document.getElementById('event-modal-title').textContent = 'Etkinlik Duzenle';
    document.getElementById('event-id').value = ev.id;
    document.getElementById('event-title').value = ev.title;
    document.getElementById('event-desc').value = ev.description || '';
    document.getElementById('event-type').value = ev.event_type;
    document.getElementById('event-start').value = ev.start_datetime ? ev.start_datetime.slice(0, 16) : '';
    document.getElementById('event-end').value = ev.end_datetime ? ev.end_datetime.slice(0, 16) : '';
    LA.populateProjectSelect('event-project', ev.project_id || '');
    LA.openModal('event-modal', 'event-modal-box');
  },

  closeModal() {
    LA.closeModal('event-modal', 'event-modal-box');
  },

  async showEventDetail(eventId) {
    try {
      const res = await LA.api.get('/calendar/' + eventId);
      const ev = res.data;
      document.getElementById('event-detail-title').textContent = ev.title;
      document.getElementById('event-detail-desc').textContent = ev.description || '';
      const typeEl = document.getElementById('event-detail-type');
      typeEl.textContent = LA.eventTypeLabel(ev.event_type);
      typeEl.className = 'inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ' + LA.eventTypeColor(ev.event_type);
      document.getElementById('event-detail-start').textContent = LA.formatDateTime(ev.start_datetime);
      document.getElementById('event-detail-end').textContent = LA.formatDateTime(ev.end_datetime);

      document.getElementById('event-detail-edit').onclick = () => { this.closeDetailModal(); this.showEditModal(ev); };
      document.getElementById('event-detail-delete').onclick = async () => {
        const ok = await LA.confirm('Etkinlik Sil', `"${ev.title}" etkinligini silmek istediginize emin misiniz?`);
        if (ok) {
          try { await LA.api.del('/calendar/' + ev.id); LA.toast('Etkinlik silindi', 'success'); this.closeDetailModal(); this.loadEvents(); }
          catch (e) { LA.toast(e.message, 'error'); }
        }
      };

      LA.openModal('event-detail-modal', 'event-detail-modal-box');
    } catch (err) { LA.toast('Etkinlik yuklenemedi', 'error'); }
  },

  closeDetailModal() {
    LA.closeModal('event-detail-modal', 'event-detail-modal-box');
  },

  async handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const projSel = document.getElementById('event-project');
    const data = {
      title: document.getElementById('event-title').value,
      description: document.getElementById('event-desc').value,
      event_type: document.getElementById('event-type').value,
      start_datetime: document.getElementById('event-start').value,
      end_datetime: document.getElementById('event-end').value || document.getElementById('event-start').value,
      project_id: projSel ? (projSel.value || null) : null
    };

    try {
      if (id) { await LA.api.put('/calendar/' + id, data); LA.toast('Etkinlik guncellendi', 'success'); }
      else { await LA.api.post('/calendar', data); LA.toast('Etkinlik olusturuldu', 'success'); }
      this.closeModal();
      this.loadEvents();
    } catch (err) { LA.toast(err.message, 'error'); }
  }
};

CalPage.init();
