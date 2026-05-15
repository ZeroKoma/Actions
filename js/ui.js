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
      labelDark: "Dark Mode",
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
  },

  setupEventListeners() {
    document.getElementById("counter-trigger").onclick = () =>
      App.registerClick();

    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmAccept = document.getElementById("confirm-accept");
    const confirmCancel = document.getElementById("confirm-cancel");
    const langSwitch = document.getElementById("lang-switch");
    const darkSwitch = document.getElementById("dark-switch");

    if (langSwitch) {
      langSwitch.checked = DB.getLang() === "en";
      langSwitch.onchange = (e) => {
        DB.setLang(e.target.checked ? "en" : "es");
        this.updateLanguageStrings();
        Calendar.init(); // Reiniciar calendario para actualizar días
      };
    }

    if (darkSwitch) {
      darkSwitch.checked = DB.getDarkMode();
      darkSwitch.onchange = (e) => {
        DB.setDarkMode(e.target.checked);
        this.applyDarkMode();
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

    // Gestos táctiles para navegación horizontal entre pantallas
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

      // Solo navegar si el desplazamiento horizontal es predominante y tiene suficiente recorrido (70px)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
        const viewsOrder = ["main", "history", "weekly", "monthly", "settings"];
        const activeView = document.querySelector(".view:not(.hidden)");
        if (!activeView) return;
        
        const currentViewName = activeView.id.replace("view-", "");
        const currentIndex = viewsOrder.indexOf(currentViewName);

        if (dx < 0 && currentIndex < viewsOrder.length - 1) {
          // Deslizar hacia la izquierda (dedo hacia la izquierda) -> Siguiente menú
          this.showView(viewsOrder[currentIndex + 1]);
        } else if (dx > 0 && currentIndex > 0) {
          // Deslizar hacia la derecha (dedo hacia la derecha) -> Menú anterior
          this.showView(viewsOrder[currentIndex - 1]);
        }
      }
    }, { passive: true });
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
    document.getElementById("label-dark").textContent = t.labelDark;
    document.getElementById("label-lang").textContent = t.labelLang;
    document.getElementById("reset-text").textContent = t.resetText;

    // Diálogo
    document.querySelector("#confirm-dialog h3").textContent = t.confirmTitle;
    document.querySelector("#confirm-dialog p").textContent = t.confirmBody;
    document.getElementById("confirm-cancel").textContent = t.cancel;
    document.getElementById("confirm-accept").textContent = t.accept;
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

    if (!newView || oldView === newView) return;

    if (oldView && content) {
      const currentViewName = oldView.id.replace("view-", "");
      const currentIndex = viewsOrder.indexOf(currentViewName);
      const targetIndex = viewsOrder.indexOf(viewName);

      content.classList.remove("slide-next", "slide-prev");
      void content.offsetWidth; // Trigger reflow
      
      const isNext = targetIndex >= currentIndex;
      content.classList.add(isNext ? "slide-next" : "slide-prev");

      // Marcamos la vieja para que se anime hacia afuera y mostramos la nueva
      oldView.classList.add("view-exit");
      newView.classList.remove("hidden");

      // Esperamos a que termine la animación para ocultar la vieja
      setTimeout(() => {
        oldView.classList.add("hidden");
        oldView.classList.remove("view-exit");
        content.classList.remove("slide-next", "slide-prev");
      }, 400);
    } else {
      // Carga inicial sin animación
      document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
      newView.classList.remove("hidden");
    }

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
