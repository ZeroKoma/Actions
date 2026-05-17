const Calendar = {
  currentWeekStart: null,
  currentMonthDate: null,
  currentHistoryDate: null,
  selectedWeeklyActionId: null,
  selectedMonthlyActionId: null,

  getWeekDays() {
    const lang = DB.getLang();
    return lang === "en"
      ? ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
      : ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
  },

  getLabels() {
    const lang = DB.getLang();
    return UI.translations[lang];
  },

  async init() {
    const now = new Date();
    // Only set initial dates if they haven't been set yet to preserve user context
    if (!this.currentWeekStart) this.currentWeekStart = this.getStartOfWeek(now);
    if (!this.currentMonthDate) this.currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (!this.currentHistoryDate) this.currentHistoryDate = await this.getInitialHistoryDate();

    this.weekDays = this.getWeekDays();
    this.setupListeners();
    await this.renderAll();
  },

  async renderAll() {
    await Promise.all([this.renderWeekly(), this.renderMonthly(), this.renderHistory()]);
  },

  async getInitialHistoryDate() {
    const now = new Date(); // Get current date and time
    now.setHours(0, 0, 0, 0); // Normalize to midnight for consistent comparison

    const events = await DB.getEvents();
    if (events.length === 0) return now;

    const hasToday = events.some(e => e.date === now.toLocaleDateString("es-ES"));
    
    if (hasToday) return now;

    // Sort events by ID (timestamp) to find the very last one
    const lastEvent = [...events].sort((a, b) => b.id - a.id)[0];
    const [d, m, y] = lastEvent.date.split('/').map(Number);
    
    // Create a new Date object for the last event and normalize to midnight
    const lastEventDate = new Date(y, m - 1, d);
    lastEventDate.setHours(0, 0, 0, 0);
    
    return lastEventDate;
  },

  getStartOfWeek(d) {
    const lang = DB.getLang();
    const date = new Date(d);
    date.setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparisons
    const day = date.getDay();
    const isEn = lang === "en";
    const diff = isEn
      ? date.getDate() - day
      : date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date;
  },

  setupListeners() {
    document.getElementById("prev-week").onclick = () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
      this.renderWeekly();
    };
    const weeklyTodayBtn = document.getElementById("weekly-today-btn");
    if (weeklyTodayBtn) {
      weeklyTodayBtn.onclick = () => {
        this.currentWeekStart = this.getStartOfWeek(new Date());
        this.renderWeekly();
      };
    }
    document.getElementById("next-week").onclick = () => {
      const todayStart = this.getStartOfWeek(new Date());
      if (this.currentWeekStart >= todayStart) return;
      
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
      this.renderWeekly();
    };
    document.getElementById("prev-month").onclick = () => {
      this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() - 1);
      this.renderMonthly();
    };
    const monthlyTodayBtn = document.getElementById("monthly-today-btn");
    if (monthlyTodayBtn) {
      monthlyTodayBtn.onclick = () => {
        const now = new Date();
        this.currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        this.renderMonthly();
      };
    }
    document.getElementById("next-month").onclick = () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (this.currentMonthDate >= thisMonth) return;

      this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + 1);
      this.renderMonthly();
    };

    // History navigation
    const todayBtn = document.getElementById("history-today-btn");
    if (todayBtn) {
      todayBtn.onclick = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight
        this.currentHistoryDate = today;
        await this.renderHistory();
      };
    }
    document.getElementById("prev-history").onclick = () => {
      this.currentHistoryDate.setDate(this.currentHistoryDate.getDate() - 1);
      this.renderHistory();
    };
    document.getElementById("next-history").onclick = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (this.currentHistoryDate >= today) return;

      this.currentHistoryDate.setDate(this.currentHistoryDate.getDate() + 1);
      this.renderHistory();
    };
  },

  async renderWeeklyActionSelector() {
    const container = document.getElementById("weekly-action-selector");
    if (!container) return;

    const actions = await DB.getActions();
    if (actions.length === 0) return;

    // Default to the first action if none selected
    if (this.selectedWeeklyActionId === null) {
      this.selectedWeeklyActionId = actions[0].id;
    }

    let html = "";
    actions.forEach(action => {
      html += `
        <div class="selector-chip ${this.selectedWeeklyActionId === action.id ? 'active' : ''}" 
             data-id="${action.id}">${action.text}</div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".selector-chip").forEach(chip => {
      chip.onclick = () => {
        this.selectedWeeklyActionId = Number(chip.dataset.id);
        this.renderWeeklyActionSelector();
        this.renderWeekly();
      };
    });
  },

  async renderWeekly() {
    const grid = document.getElementById("weekly-grid");
    const label = document.getElementById("week-label");
    const chartContainer = document.getElementById("weekly-chart");
    const totalContainer = document.getElementById("weekly-total");
    const events = await DB.getEvents();
    
    // Ensure we have a selection before filtering
    const actions = await DB.getActions();
    if (actions.length > 0 && this.selectedWeeklyActionId === null) {
      this.selectedWeeklyActionId = actions[0].id;
    }

    const selectedAction = actions.find(a => a.id === this.selectedWeeklyActionId);
    const goal = selectedAction ? (selectedAction.goal || 0) : 0;

    await this.renderWeeklyActionSelector();

    const filteredEvents = this.selectedWeeklyActionId 
      ? events.filter(e => e.actionId === this.selectedWeeklyActionId)
      : events;

    grid.innerHTML = "";
    const dailyData = [];
    const t = this.getLabels();

    const todayNormalized = new Date();
    todayNormalized.setHours(0, 0, 0, 0);

    let weeklyTotal = 0;

    // Add day headers
    this.weekDays.forEach((dayName) => {
      grid.innerHTML += `<div class="calendar-header-cell">${dayName}</div>`;
    });

    const start = new Date(this.currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    // Disable next-week button if we are in current week
    const nextBtn = document.getElementById("next-week");
    const isCurrentWeek = this.currentWeekStart >= this.getStartOfWeek(new Date());
    if (nextBtn) {
      nextBtn.disabled = isCurrentWeek;
      nextBtn.style.opacity = isCurrentWeek ? "0.3" : "1";
    }

    // Toggle weekly today button visibility
    const weeklyTodayBtn = document.getElementById("weekly-today-btn");
    const todayStart = this.getStartOfWeek(new Date());
    if (weeklyTodayBtn) {
      weeklyTodayBtn.style.display = this.currentWeekStart.getTime() === todayStart.getTime() ? "none" : "block";
    }

    const locale = DB.getLang() === "en" ? "en-US" : "es-ES";
    label.textContent = `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} - ${end.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(currentDay.getDate() + i);
      const dateStr = currentDay.toLocaleDateString("es-ES"); // Date key is kept in es-ES for compatibility with DB
      const count = filteredEvents.filter((e) => e.date === dateStr).length;

      dailyData.push({
        count,
        dayName: this.weekDays[i],
      });
      weeklyTotal += count;

      const isFuture = currentDay > todayNormalized;
      const today = new Date();
      const isToday =
        currentDay.getDate() === today.getDate() &&
        currentDay.getMonth() === today.getMonth() &&
        currentDay.getFullYear() === today.getFullYear();

      const dayOfWeek = currentDay.getDay();
      const isTargetDay = !selectedAction || !selectedAction.activeDays || selectedAction.activeDays.length === 0 || selectedAction.activeDays.includes(dayOfWeek);
      const hasTarget = selectedAction && goal > 0 && isTargetDay;
      const isCompleted = isTargetDay && goal > 0 && count >= goal;

      const cell = document.createElement("div");
      cell.className = `day-cell ${isToday ? "current-day" : ""} ${count > 0 ? "has-activity" : ""} ${isCompleted ? "completed" : ""} ${hasTarget ? "has-target" : ""} ${isFuture ? "future-day" : ""}`;
      cell.innerHTML = `
        <div class="day-num">${currentDay.getDate()}</div>
        ${count > 0 ? `<div class="count">${count}</div>` : ''}
      `;

      cell.onclick = () => {
        if (isFuture) return;
        
        if (count > 0) {
          this.currentHistoryDate = new Date(currentDay);
          UI.showView('history');
        } else {
          UI.showManualEntryDialog(new Date(currentDay));
        }
      };

      grid.appendChild(cell);
    }

    // Render line chart with points
    if (chartContainer) {
      const maxCount = Math.max(...dailyData.map((d) => d.count), 1);
      const width = 600;
      const height = 200;
      const padding = 40;

      const points = dailyData.map((data, i) => {
        const x = (width / (dailyData.length - 1)) * i;
        const y =
          height - ((data.count / maxCount) * (height - padding * 2) + padding);
        return { x, y, count: data.count };
      });

      const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
      const areaPoints = `0,${height} ${polylinePoints} ${width},${height}`;

      chartContainer.innerHTML = `
        <svg viewBox="0 -40 ${width} ${height + 60}" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.2" />
              <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <polygon points="${areaPoints}" fill="url(#area-gradient)" class="chart-area" />
          <polyline points="${polylinePoints}" class="chart-line" />
          ${points
            .map(
              (p, i) => `
            <circle cx="${p.x}" cy="${p.y}" r="6" class="chart-point" style="animation-delay: ${i * 0.15}s" />
            ${p.count > 0 ? `<text x="${p.x}" y="${p.y - 18}" text-anchor="middle" class="chart-text" style="animation-delay: ${i * 0.15}s; fill: var(--primary); font-size: 18px; font-weight: bold; font-family: sans-serif;">${p.count}</text>` : ''}
          `,
            )
            .join("")}
        </svg>
        <div class="chart-labels">
          ${dailyData.map((d) => `<span class="chart-bar-label">${d.dayName}</span>`).join("")}
        </div>
      `;
    }

    if (totalContainer) {
      totalContainer.innerHTML = `${t.weekly === "Weekly" ? "Weekly total" : "Total de la semana"}: <span class="weekly-total-value">${weeklyTotal}</span>`;
    }
  },

  async renderMonthlyActionSelector() {
    const container = document.getElementById("monthly-action-selector");
    if (!container) return;

    const actions = await DB.getActions();
    if (actions.length === 0) return;

    // Default to the first action if none selected
    if (this.selectedMonthlyActionId === null) {
      this.selectedMonthlyActionId = actions[0].id;
    }

    let html = "";
    actions.forEach(action => {
      html += `
        <div class="selector-chip ${this.selectedMonthlyActionId === action.id ? 'active' : ''}" 
             data-id="${action.id}">${action.text}</div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".selector-chip").forEach(chip => {
      chip.onclick = () => {
        this.selectedMonthlyActionId = Number(chip.dataset.id);
        this.renderMonthlyActionSelector();
        this.renderMonthly();
      };
    });
  },

  async renderMonthly() {
    const grid = document.getElementById("monthly-grid");
    const label = document.getElementById("month-label");
    const totalContainer = document.getElementById("monthly-total");
    const events = await DB.getEvents();
    const t = this.getLabels();

    // Ensure we have a selection before filtering
    const actions = await DB.getActions();
    if (actions.length > 0 && this.selectedMonthlyActionId === null) {
      this.selectedMonthlyActionId = actions[0].id;
    }

    const selectedAction = actions.find(a => a.id === this.selectedMonthlyActionId);
    const goal = selectedAction ? (selectedAction.goal || 0) : 0;

    await this.renderMonthlyActionSelector();

    const filteredEvents = this.selectedMonthlyActionId 
      ? events.filter(e => e.actionId === this.selectedMonthlyActionId)
      : events;

    grid.innerHTML = "";
    let monthlyTotal = 0;

    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();
    const locale = DB.getLang() === "en" ? "en-US" : "es-ES";
    label.textContent = this.currentMonthDate
      .toLocaleDateString(locale, { month: "long", year: "numeric" })
      .toUpperCase();

    // Disable next-month button if we are in current month
    const nextBtn = document.getElementById("next-month");
    const isCurrentMonth = this.currentMonthDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (nextBtn) {
      nextBtn.disabled = isCurrentMonth;
      nextBtn.style.opacity = isCurrentMonth ? "0.3" : "1";
    }

    // Toggle monthly today button visibility
    const monthlyTodayBtn = document.getElementById("monthly-today-btn");
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (monthlyTodayBtn) {
      monthlyTodayBtn.style.display = this.currentMonthDate.getTime() === thisMonth.getTime() ? "none" : "block";
    }

    // Add day headers
    this.weekDays.forEach((dayName) => {
      grid.innerHTML += `<div class="calendar-header-cell">${dayName}</div>`;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const isEn = DB.getLang() === "en";
    const offset = isEn ? firstDay : firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const todayNormalized = new Date();
    todayNormalized.setHours(0, 0, 0, 0);

    // Fill leading empty days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < offset; i++) {
      const d = prevMonthLastDay - offset + i + 1;
      const cell = document.createElement("div");
      cell.className = "day-cell other-month";
      cell.innerHTML = `<div class="day-num">${d}</div>`;
      grid.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toLocaleDateString("es-ES");
      const count = filteredEvents.filter((e) => e.date === dateStr).length;
      monthlyTotal += count;

      const isFuture = dateObj > todayNormalized;
      const today = new Date();
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      const dayOfWeek = new Date(year, month, d).getDay();
      const isTargetDay = !selectedAction || !selectedAction.activeDays || selectedAction.activeDays.length === 0 || selectedAction.activeDays.includes(dayOfWeek);
      const hasTarget = selectedAction && goal > 0 && isTargetDay;
      const isCompleted = isTargetDay && goal > 0 && count >= goal;

      const cell = document.createElement("div");
      cell.className = `day-cell ${isToday ? "current-day" : ""} ${count > 0 ? "has-activity" : ""} ${isCompleted ? "completed" : ""} ${hasTarget ? "has-target" : ""} ${isFuture ? "future-day" : ""}`;
      cell.innerHTML = `
        <div class="day-num">${d}</div>
        ${count > 0 ? `<div class="count">${count}</div>` : ''}
      `;

      cell.onclick = () => {
        if (isFuture) return;
        
        if (count > 0) {
          this.currentHistoryDate = new Date(year, month, d);
          UI.showView('history');
        } else {
          UI.showManualEntryDialog(new Date(year, month, d));
        }
      };

      grid.appendChild(cell);
    }

    // Fill trailing empty days to complete the grid (up to 6 rows of days)
    const totalCells = offset + daysInMonth;
    const remainingCells = 42 - totalCells; // 6 weeks * 7 days = 42 cells total (including headers)
    for (let i = 1; i <= remainingCells; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell other-month";
      cell.innerHTML = `<div class="day-num">${i}</div>`;
      grid.appendChild(cell);
    }

    if (totalContainer) {
      totalContainer.innerHTML = `${t.monthly === "Monthly" ? "Monthly total" : "Total del mes"}: <span class="weekly-total-value">${monthlyTotal}</span>`;
    }
  },

  async renderHistory() {
    const events = await DB.getEvents();
    const actions = await DB.getActions();
    const container = document.getElementById("history-list");
    const label = document.getElementById("history-date-label");
    const t = this.getLabels();

    // Normalize currentHistoryDate to midnight for comparison
    const currentHistoryDateMidnight = new Date(this.currentHistoryDate);
    currentHistoryDateMidnight.setHours(0, 0, 0, 0);

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const isToday = currentHistoryDateMidnight.getTime() === todayMidnight.getTime();
    label.textContent = isToday ? t.today : this.currentHistoryDate.toLocaleDateString(DB.getLang() === "en" ? "en-US" : "es-ES", { day: 'numeric', month: 'short', year: 'numeric' });

    // Disable next-history button if we are at today
    const nextBtn = document.getElementById("next-history");
    if (nextBtn) {
      nextBtn.disabled = isToday;
      nextBtn.style.opacity = isToday ? "0.3" : "1";
    }

    const dateStr = currentHistoryDateMidnight.toLocaleDateString("es-ES"); // Use normalized date for filtering
    const dayEvents = events.filter(e => e.date === dateStr);

    const todayBtn = document.getElementById("history-today-btn");
    if (todayBtn) todayBtn.style.display = isToday ? "none" : "block";

    if (dayEvents.length === 0) {
      container.innerHTML = `<div class="empty-history">${t.historyEmpty}</div>`;
      return;
    }

    container.innerHTML = "";

    actions.forEach(action => {
      const actionEvents = dayEvents.filter(e => e.actionId === action.id);
      if (actionEvents.length === 0) return;

      const group = document.createElement("div");
      group.className = "history-action-group";
      group.innerHTML = `
        <div class="history-action-header">
          <span class="history-action-name">${action.text}</span>
          <span class="history-total-badge">${actionEvents.length}</span>
        </div>
        <div class="history-time-grid">
          ${actionEvents.map(e => `
            <div class="history-time-item" data-event-id="${e.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>${e.time}</span>
            </div>
          `).join('')}
        </div>
      `;

      group.querySelectorAll('.history-time-item').forEach(item => {
        item.onclick = () => UI.showEditEventDialog(Number(item.dataset.eventId));
      });

      container.appendChild(group);
    });
  },
};
