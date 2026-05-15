const Calendar = {
  currentWeekStart: null,
  currentMonthDate: null,
  WEEK_DAYS: ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"],

  init() {
    const now = new Date();
    this.currentWeekStart = this.getStartOfWeek(now);
    this.currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    this.setupListeners();
    this.renderHistory();
    this.renderWeekly();
    this.renderMonthly();
  },

  getStartOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
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
    const totalContainer = document.getElementById("weekly-total");
    const events = DB.getEvents();
    grid.innerHTML = "";

    let weeklyTotal = 0;

    // Add day headers
    this.WEEK_DAYS.forEach((dayName) => {
      grid.innerHTML += `<div class="calendar-header-cell">${dayName}</div>`;
    });

    const start = new Date(this.currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    label.textContent = `${start.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(currentDay.getDate() + i);
      const dateStr = currentDay.toLocaleDateString("es-ES");
      const count = events.filter((e) => e.date === dateStr).length;
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

    if (totalContainer) {
      totalContainer.innerHTML = `Total de la semana: <span class="weekly-total-value">${weeklyTotal}</span>`;
    }
  },

  renderMonthly() {
    const grid = document.getElementById("monthly-grid");
    const label = document.getElementById("month-label");
    const events = DB.getEvents();
    grid.innerHTML = "";

    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();
    label.textContent = this.currentMonthDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();

    // Add day headers
    this.WEEK_DAYS.forEach((dayName) => {
      grid.innerHTML += `<div class="calendar-header-cell">${dayName}</div>`;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
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
    const events = DB.getEvents().reverse();
    const container = document.getElementById("history-list");
    container.innerHTML = events
      .map(
        (e) => `
            <div style="padding:10px; border-bottom:1px solid #ddd;">
                <strong>${e.time}</strong> - ${e.date}
            </div>
        `,
      )
      .join("");
  },
};
