const Calendar = {
  currentWeekStart: null,
  currentMonthDate: null,
  currentHistoryDate: null,

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

  init() {
    const now = new Date();
    this.currentWeekStart = this.getStartOfWeek(now);
    this.currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.currentHistoryDate = this.getInitialHistoryDate();

    this.weekDays = this.getWeekDays();
    this.setupListeners();
    this.renderHistory();
    this.renderWeekly();
    this.renderMonthly();
  },

  getInitialHistoryDate() {
    const now = new Date();
    const events = DB.getEvents();
    if (events.length === 0) return now;

    const todayStr = now.toLocaleDateString("es-ES");
    const hasToday = events.some(e => e.date === todayStr);
    
    if (hasToday) return now;

    // Si no hay hoy, buscamos el día anterior (ayer)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
    // Nota: Podríamos buscar el último día con eventos, pero el requerimiento 
    // pide día actual y si no existe, día anterior.
  },

  getStartOfWeek(d) {
    const lang = DB.getLang();
    const date = new Date(d);
    const day = date.getDay();
    const isEn = lang === "en";
    const diff = isEn
      ? date.getDate() - day
      : date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  },

  setupListeners() {
    document.getElementById("prev-week").onclick = () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
      this.renderWeekly();
    };
    document.getElementById("next-week").onclick = () => {
      this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
      this.renderWeekly();
    };
    document.getElementById("prev-month").onclick = () => {
      this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() - 1);
      this.renderMonthly();
    };
    document.getElementById("next-month").onclick = () => {
      this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + 1);
      this.renderMonthly();
    };
  },

  renderWeekly() {
    const grid = document.getElementById("weekly-grid");
    const label = document.getElementById("week-label");
    const chartContainer = document.getElementById("weekly-chart");
    const totalContainer = document.getElementById("weekly-total");
    const events = DB.getEvents();
    grid.innerHTML = "";
    const dailyData = [];
    const t = this.getLabels();

    let weeklyTotal = 0;

    // Add day headers
    this.weekDays.forEach((dayName) => {
      grid.innerHTML += `<div class="calendar-header-cell">${dayName}</div>`;
    });

    const start = new Date(this.currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const locale = DB.getLang() === "en" ? "en-US" : "es-ES";
    label.textContent = `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} - ${end.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(currentDay.getDate() + i);
      const dateStr = currentDay.toLocaleDateString("es-ES"); // La clave de fecha se mantiene en es-ES para compatibilidad con DB
      const count = events.filter((e) => e.date === dateStr).length;

      dailyData.push({
        count,
        dayName: this.weekDays[i],
      });
      weeklyTotal += count;

      const today = new Date();
      const isToday =
        currentDay.getDate() === today.getDate() &&
        currentDay.getMonth() === today.getMonth() &&
        currentDay.getFullYear() === today.getFullYear();

      const cell = document.createElement("div");
      cell.className = `day-cell ${isToday ? "current-day" : ""} ${count > 0 ? "has-activity" : ""}`;
      cell.innerHTML = `
        <div class="day-num">${currentDay.getDate()}</div>
        <div class="count">${count}</div>
      `;
      grid.appendChild(cell);
    }

    // Renderizar la gráfica de línea con puntos
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
            <text x="${p.x}" y="${p.y - 18}" text-anchor="middle" class="chart-text" style="animation-delay: ${i * 0.15}s; fill: var(--primary); font-size: 18px; font-weight: bold; font-family: sans-serif;">${p.count}</text>
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

  renderMonthly() {
    const grid = document.getElementById("monthly-grid");
    const label = document.getElementById("month-label");
    const events = DB.getEvents();
    grid.innerHTML = "";

    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();
    const locale = DB.getLang() === "en" ? "en-US" : "es-ES";
    label.textContent = this.currentMonthDate
      .toLocaleDateString(locale, { month: "long", year: "numeric" })
      .toUpperCase();

    // Add day headers
    this.weekDays.forEach((dayName) => {
      grid.innerHTML += `<div class="calendar-header-cell">${dayName}</div>`;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const isEn = DB.getLang() === "en";
    const offset = isEn ? firstDay : firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fill leading empty days
    for (let i = 0; i < offset; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell other-month";
      grid.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, month, d).toLocaleDateString("es-ES");
      const count = events.filter((e) => e.date === dateStr).length;

      const today = new Date();
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      const cell = document.createElement("div");
      cell.className = `day-cell ${isToday ? "current-day" : ""} ${count > 0 ? "has-activity" : ""}`;
      cell.innerHTML = `
        <div class="day-num">${d}</div>
        <div class="count">${count}</div>
      `;
      grid.appendChild(cell);
    }

    // Fill trailing empty days to complete the grid (up to 6 rows of days)
    const totalCells = offset + daysInMonth;
    const remainingCells = 42 - totalCells; // 6 weeks * 7 days = 42 cells total (including headers)
    for (let i = 0; i < remainingCells; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell other-month";
      grid.appendChild(cell);
    }
  },

  renderHistory() {
    const events = DB.getEvents();
    const container = document.getElementById("history-list");
    const label = document.getElementById("history-date-label");
    const t = this.getLabels();

    const dateStr = this.currentHistoryDate.toLocaleDateString("es-ES");
    const dayEvents = events.filter(e => e.date === dateStr);
    
    // Formatear etiqueta de fecha
    const isToday = dateStr === new Date().toLocaleDateString("es-ES");
    label.textContent = isToday ? t.today : this.currentHistoryDate.toLocaleDateString(DB.getLang() === "en" ? "en-US" : "es-ES", { day: 'numeric', month: 'short', year: 'numeric' });

    if (dayEvents.length === 0) {
      container.innerHTML = `<div class="empty-history">${t.historyEmpty}</div>`;
      return;
    }

    container.innerHTML = `
      <div class="history-summary">
        <span class="history-total-badge">${dayEvents.length}</span>
      </div>
      <div class="history-time-grid">
        ${dayEvents.map(e => `
          <div class="history-time-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${e.time}</span>
          </div>
        `).join('')}
      </div>
    `;
  },
};
