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
      labelLang: "Idioma",
      resetText: "Eliminar todo y empezar de nuevo",
      confirmTitle: "Confirmar acción",
      confirmBody: "¿Seguro? Se borrarán todos los datos.",
      cancel: "Cancelar",
      accept: "Aceptar",
      historyEmpty: "Sin actividad este día",
      weekLabel: "Semana",
      monthLabel: "Mes",
      today: "Hoy"
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
      labelLang: "Language",
      resetText: "Delete all and start over",
      confirmTitle: "Confirm action",
      confirmBody: "Are you sure? All data will be deleted.",
      cancel: "Cancel",
      accept: "Accept",
      historyEmpty: "No activity this day",
      weekLabel: "Week",
      monthLabel: "Month",
      today: "Today"
    }
  },

  renderMain() {
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
  },

  setupEventListeners() {
    document.getElementById("counter-trigger").onclick = () =>
      App.registerClick();

    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmAccept = document.getElementById("confirm-accept");
    const confirmCancel = document.getElementById("confirm-cancel");
    const langSwitch = document.getElementById("lang-switch");

    if (langSwitch) {
      langSwitch.checked = DB.getLang() === "en";
      langSwitch.onchange = (e) => {
        DB.setLang(e.target.checked ? "en" : "es");
        this.updateLanguageStrings();
        Calendar.init(); // Reiniciar calendario para actualizar días
      };
    }

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
  },

  updateLanguageStrings() {
    const lang = DB.getLang();
    const t = this.translations[lang];

    // Títulos de navegación y header
    document.getElementById("app-title").textContent = t.appTitle;
    document.querySelectorAll('[data-view="main"] span, [data-view="main"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.main; });
    document.querySelectorAll('[data-view="weekly"] span, [data-view="weekly"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.weekly; });
    document.querySelectorAll('[data-view="monthly"] span, [data-view="monthly"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.monthly; });
    document.querySelectorAll('[data-view="history"] span, [data-view="history"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.history; });
    document.querySelectorAll('[data-view="settings"] span, [data-view="settings"]').forEach(el => { if(el.tagName === 'SPAN') el.textContent = t.settings; });

    // Vistas específicas
    if (document.getElementById("undo-button")) {
      const undoSvg = document.getElementById("undo-button").querySelector('svg');
      document.getElementById("undo-button").textContent = "";
      document.getElementById("undo-button").appendChild(undoSvg);
      document.getElementById("undo-button").append(` ${t.undo}`);
    }
    
    document.getElementById("settings-title").textContent = t.settingsTitle;
    document.getElementById("label-lang").textContent = t.labelLang;
    document.getElementById("reset-text").textContent = t.resetText;

    // Diálogo
    document.querySelector("#confirm-dialog h3").textContent = t.confirmTitle;
    document.querySelector("#confirm-dialog p").textContent = t.confirmBody;
    document.getElementById("confirm-cancel").textContent = t.cancel;
    document.getElementById("confirm-accept").textContent = t.accept;
  },

  showView(viewName) {
    const lang = DB.getLang();
    const t = this.translations[lang];

    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.add("hidden"));
    document.getElementById(`view-${viewName}`).classList.remove("hidden");
    document.getElementById("app-title").textContent = t[viewName] || t.appTitle;

    // Actualizar datos de calendarios al cambiar de vista
    if (viewName === "weekly") Calendar.renderWeekly();
    if (viewName === "monthly") Calendar.renderMonthly();
    if (viewName === "history") Calendar.renderHistory();

    // Actualizar estado activo en menú lateral y móvil
    document.querySelectorAll(".menu-links button, .mobile-nav button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });
  },

  animateClick() {
    const card = document.getElementById("counter-trigger");
    const badge = card.querySelector(".counter-badge");
    const countEl = document.getElementById("main-count");

    // Animación de escala en la tarjeta
    card.style.transform = "scale(0.95)";
    setTimeout(() => (card.style.transform = "scale(1)"), 100);

    // Animación "pop" en el número
    countEl.classList.remove("pop-animation");
    void countEl.offsetWidth; // Forzar reflujo para reiniciar animación
    countEl.classList.add("pop-animation");

    // Crear indicador +1 flotante
    const indicator = document.createElement("span");
    indicator.textContent = "+1";
    indicator.className = "click-indicator";
    badge.appendChild(indicator);

    // Limpiar el indicador después de la animación
    setTimeout(() => indicator.remove(), 800);
  },
};
