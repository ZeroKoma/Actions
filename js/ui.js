const UI = {
  translations: {
    es: {
      appTitle: "Principal",
      main: "Principal",
      weekly: "Semanal",
      monthly: "Mensual",
      history: "Diario",
      settings: "Ajustes",
      undo: "Deshacer",
      settingsTitle: "Configuración",
      labelDark: "Modo Oscuro",
      labelLang: "Idioma",
      resetText: "Eliminar todo y empezar de nuevo",
      confirmTitle: "Confirmar acción",
      confirmBody: "¿Seguro? Se borrarán todos los datos.",
      cancel: "Cancelar",
      accept: "Aceptar",
      historyEmpty: "Sin actividad este día",
      reports: "Informes",
      weeklyReport: "Informe Semanal",
      monthlyReport: "Informe Mensual",
      totalActions: "Total de acciones",
      dailyAverage: "Media diaria",
      close: "Cerrar",
      weekLabel: "Semana",
      monthLabel: "Mes",
      today: "Hoy",
      version: "Versión"
    },
    en: {
      appTitle: "Home",
      main: "Home",
      weekly: "Weekly",
      monthly: "Monthly",
      history: "Diary",
      settings: "Settings",
      undo: "Undo",
      settingsTitle: "Configuration",
      labelDark: "Dark Mode",
      labelLang: "Language",
      resetText: "Delete all and start over",
      confirmTitle: "Confirm action",
      confirmBody: "Are you sure? All data will be deleted.",
      cancel: "Cancel",
      accept: "Accept",
      historyEmpty: "No activity this day",
      reports: "Reports",
      weeklyReport: "Weekly Report",
      monthlyReport: "Monthly Report",
      totalActions: "Total actions",
      dailyAverage: "Daily average",
      close: "Close",
      weekLabel: "Week",
      monthLabel: "Month",
      today: "Today",
      version: "Version"
    }
  },

  currentReportType: null,

  renderMain() {
    this.applyDarkMode();
    this.updateLanguageStrings();
    const config = DB.getConfig();
    const events = DB.getEvents();

    document.getElementById("main-count").textContent = events.length;

    const undoBtn = document.getElementById("undo-button");
    if (undoBtn) {
      undoBtn.classList.toggle("hidden", events.length === 0);
    }

    const img = document.getElementById("display-image");
    if (config.image) {
      img.src = config.image;
      img.classList.remove("hidden");
    }

    const textEl = document.getElementById("display-text");
    if (textEl) {
      textEl.textContent = config.text;
    }
  },

  setupEventListeners() {
    document.getElementById("counter-trigger").onclick = () =>
      App.registerClick();

    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmAccept = document.getElementById("confirm-accept");
    const confirmCancel = document.getElementById("confirm-cancel");
    const langSwitch = document.getElementById("lang-switch");
    const darkSwitch = document.getElementById("dark-switch");
    const reportDialog = document.getElementById("report-dialog");
    const reportClose = document.getElementById("report-dialog-close");
    const btnWeekly = document.getElementById("btn-report-weekly");
    const btnMonthly = document.getElementById("btn-report-monthly");
    const reportPrev = document.getElementById("report-prev");
    const reportNext = document.getElementById("report-next");

    if (btnWeekly) btnWeekly.onclick = () => this.showReport("weekly");
    if (btnMonthly) btnMonthly.onclick = () => this.showReport("monthly");
    if (reportClose) reportClose.onclick = () => reportDialog.close();

    if (reportPrev) {
      reportPrev.onclick = () => {
        if (this.currentReportType === "weekly") {
          Calendar.currentWeekStart.setDate(Calendar.currentWeekStart.getDate() - 7);
          Calendar.renderWeekly();
        } else if (this.currentReportType === "monthly") {
          Calendar.currentMonthDate.setMonth(Calendar.currentMonthDate.getMonth() - 1);
          Calendar.renderMonthly();
        }
        this.showReport(this.currentReportType);
      };
    }

    if (reportNext) {
      reportNext.onclick = () => {
        if (this.currentReportType === "weekly") {
          Calendar.currentWeekStart.setDate(Calendar.currentWeekStart.getDate() + 7);
          Calendar.renderWeekly();
        } else if (this.currentReportType === "monthly") {
          Calendar.currentMonthDate.setMonth(Calendar.currentMonthDate.getMonth() + 1);
          Calendar.renderMonthly();
        }
        this.showReport(this.currentReportType);
      };
    }

    if (langSwitch) {
      langSwitch.checked = DB.getLang() === "en";
      langSwitch.onchange = (e) => {
        DB.setLang(e.target.checked ? "en" : "es");
        this.updateLanguageStrings();
        Calendar.init(); // Reset calendar to update days
      };
    }

    if (darkSwitch) {
      darkSwitch.checked = DB.getDarkMode();
      darkSwitch.onchange = (e) => {
        DB.setDarkMode(e.target.checked);
        this.applyDarkMode();
      };
    }

    document.querySelectorAll(".mobile-nav button").forEach((btn) => {
      btn.onclick = () => this.showView(btn.dataset.view);
    });

    document.getElementById("reset-app").onclick = () => {
      confirmDialog.showModal();
    };

    confirmAccept.onclick = () => DB.clearAll();
    confirmCancel.onclick = () => confirmDialog.close();

    const undoBtn = document.getElementById("undo-button");
    if (undoBtn) {
      undoBtn.onclick = () => App.undoLastAction();
    }

    document.getElementById("prev-history").onclick = () => {
      Calendar.currentHistoryDate.setDate(Calendar.currentHistoryDate.getDate() - 1);
      Calendar.renderHistory();
    };
    document.getElementById("next-history").onclick = () => {
      Calendar.currentHistoryDate.setDate(Calendar.currentHistoryDate.getDate() + 1);
      Calendar.renderHistory();
    };

    // Touch gestures for horizontal navigation between screens
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      // Only navigate if horizontal displacement is predominant and has enough travel (70px)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
        const viewsOrder = ["main", "history", "weekly", "monthly", "settings"];
        const activeView = document.querySelector(".view:not(.hidden)");
        if (!activeView) return;
        
        const currentViewName = activeView.id.replace("view-", "");
        const currentIndex = viewsOrder.indexOf(currentViewName);

        if (dx < 0 && currentIndex < viewsOrder.length - 1) {
          // Swipe left (finger to the left) -> Next menu
          this.showView(viewsOrder[currentIndex + 1]);
        } else if (dx > 0 && currentIndex > 0) {
          // Swipe right (finger to the right) -> Previous menu
          this.showView(viewsOrder[currentIndex - 1]);
        }
      }
    }, { passive: true });
  },

  updateLanguageStrings() {
    const lang = DB.getLang();
    const t = this.translations[lang];

    // Navigation and header titles
    document.getElementById("app-title").textContent = t.appTitle;
    document.querySelectorAll('[data-view="main"] span, [data-view="main"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.main; });
    document.querySelectorAll('[data-view="weekly"] span, [data-view="weekly"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.weekly; });
    document.querySelectorAll('[data-view="monthly"] span, [data-view="monthly"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.monthly; });
    document.querySelectorAll('[data-view="history"] span, [data-view="history"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.history; });
    document.querySelectorAll('[data-view="settings"] span, [data-view="settings"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.settings; });

    // Specific views
    if (document.getElementById("undo-button")) {
      const undoSvg = document.getElementById("undo-button").querySelector('svg');
      document.getElementById("undo-button").textContent = "";
      document.getElementById("undo-button").appendChild(undoSvg);
      document.getElementById("undo-button").append(` ${t.undo}`);
    }
    
    document.getElementById("settings-title").textContent = t.settingsTitle;
    document.getElementById("label-dark").textContent = t.labelDark;
    document.getElementById("label-lang").textContent = t.labelLang;
    document.getElementById("reset-text").textContent = t.resetText;
    document.getElementById("label-version").textContent = t.version;
    document.getElementById("app-version").textContent = Utils.VERSION;

    // Dialog
    document.querySelector("#confirm-dialog h3").textContent = t.confirmTitle;
    document.querySelector("#confirm-dialog p").textContent = t.confirmBody;
    document.getElementById("confirm-cancel").textContent = t.cancel;
    document.getElementById("confirm-accept").textContent = t.accept;

    if (document.getElementById("label-reports")) {
      document.getElementById("label-reports").textContent = t.reports;
      document.getElementById("btn-report-weekly").textContent = t.weekly;
      document.getElementById("btn-report-monthly").textContent = t.monthly;
      document.getElementById("report-dialog-close").textContent = t.close;
    }
  },

  applyDarkMode() {
    const isDark = DB.getDarkMode();
    document.body.classList.toggle("dark-mode", isDark);
  },

  showView(viewName) {
    const lang = DB.getLang();
    const t = this.translations[lang];
    const viewsOrder = ["main", "history", "weekly", "monthly", "settings"];
    
    const oldView = document.querySelector(".view:not(.hidden)");
    const newView = document.getElementById(`view-${viewName}`);
    const content = document.getElementById("content");

    if (!newView) return;

    // Update active state in mobile menu (even if it's the same view)
    document.querySelectorAll(".mobile-nav button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    if (oldView === newView) return;

    if (oldView && content) {
      const currentViewName = oldView.id.replace("view-", "");
      const currentIndex = viewsOrder.indexOf(currentViewName);
      const targetIndex = viewsOrder.indexOf(viewName);

      content.classList.remove("slide-next", "slide-prev");
      void content.offsetWidth; // Trigger reflow
      
      const isNext = targetIndex >= currentIndex;
      content.classList.add(isNext ? "slide-next" : "slide-prev");

      // Mark the old view to animate out and show the new one
      oldView.classList.add("view-exit");
      newView.classList.remove("hidden");

      // Wait for the animation to finish to hide the old view
      setTimeout(() => {
        oldView.classList.add("hidden");
        oldView.classList.remove("view-exit");
        content.classList.remove("slide-next", "slide-prev");
      }, 400);
    } else {
      // Initial load without animation
      document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
      newView.classList.remove("hidden");
    }

    document.getElementById("app-title").textContent = t[viewName] || t.appTitle;

    // Update calendar data when switching views
    if (viewName === "weekly") Calendar.renderWeekly();
    if (viewName === "monthly") Calendar.renderMonthly();
    if (viewName === "history") Calendar.renderHistory();
  },

  showReport(type) {
    this.currentReportType = type;
    const lang = DB.getLang();
    const t = this.translations[lang];
    const events = DB.getEvents();
    const reportDialog = document.getElementById("report-dialog");
    const reportTitle = document.getElementById("report-dialog-title");
    const reportBody = document.getElementById("report-dialog-body");

    let total = 0;
    let days = 0;
    let periodLabel = "";
    const locale = lang === 'en' ? 'en-US' : 'es-ES';

    if (type === "weekly") {
      const start = new Date(Calendar.currentWeekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      periodLabel = `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} - ${end.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;
      reportTitle.textContent = t.weeklyReport;

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString("es-ES");
        total += events.filter((e) => e.date === dateStr).length;
      }
      days = 7;
    } else {
      const year = Calendar.currentMonthDate.getFullYear();
      const month = Calendar.currentMonthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      periodLabel = Calendar.currentMonthDate.toLocaleDateString(locale, { month: "long", year: "numeric" });
      reportTitle.textContent = t.monthlyReport;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = new Date(year, month, d).toLocaleDateString("es-ES");
        total += events.filter((e) => e.date === dateStr).length;
      }
      days = daysInMonth;
    }

    const average = (total / days).toFixed(2);

    reportBody.innerHTML = `
      <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem; font-weight: 500;">${periodLabel}</p>
      <div style="background: #f1f5f9; padding: 1.2rem; border-radius: 16px; display: flex; flex-direction: column; gap: 0.8rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 500; color: #475569;">${t.totalActions}</span>
          <span style="font-weight: 700; font-size: 1.2rem; color: var(--primary);">${total}</span>
        </div>
        <div style="height: 1px; background: #e2e8f0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 500; color: #475569;">${t.dailyAverage}</span>
          <span style="font-weight: 700; font-size: 1.2rem; color: var(--primary);">${average}</span>
        </div>
      </div>
    `;

    if (!reportDialog.open) reportDialog.showModal();
  },

  animateClick() {
    const card = document.getElementById("counter-trigger");
    const badge = card.querySelector(".counter-badge");
    const countEl = document.getElementById("main-count");

    // Scale animation on the card
    card.style.transform = "scale(0.95)";
    setTimeout(() => (card.style.transform = "scale(1)"), 100);

    // "Pop" animation on the number
    countEl.classList.remove("pop-animation");
    void countEl.offsetWidth; // Force reflow to restart animation
    countEl.classList.add("pop-animation");

    // Create floating +1 indicator
    const indicator = document.createElement("span");
    indicator.textContent = "+1";
    indicator.className = "click-indicator";
    badge.appendChild(indicator);

    // Clean up indicator after animation
    setTimeout(() => indicator.remove(), 800);
  },
};
