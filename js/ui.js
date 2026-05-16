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
      close: "Cerrar",
      weekLabel: "Semana",
      monthLabel: "Mes",
      today: "Hoy",
      version: "Versión",
      editAction: "Configurar acción",
      addAction: "Nueva acción",
      editPlaceholder: "Nombre de la acción",
      editGoal: "Meta diaria (0 = libre)",
      min: "Mínimo",
      max: "Máximo",
      completed: "¡Completado!"
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
      close: "Close",
      weekLabel: "Week",
      monthLabel: "Month",
      today: "Today",
      version: "Version",
      editAction: "Configure action",
      addAction: "New action",
      editPlaceholder: "Action name",
      editGoal: "Daily goal (0 = free)",
      min: "Minimum",
      max: "Maximum",
      completed: "Completed!"
    }
  },

  currentEditingId: null,

  async renderMain() {
    this.applyDarkMode();
    this.updateLanguageStrings();
    const actions = await DB.getActions();
    const events = await DB.getEvents();
    const today = Utils.getTodayKey();
    const container = document.getElementById("actions-container");
    if (!container) return;
    
    container.innerHTML = "";
    const t = this.translations[DB.getLang()];

    actions.forEach(action => {
      const todayEvents = events.filter(e => e.actionId === action.id && e.date === today);
      const count = todayEvents.length;
      const goal = action.goal || 0;
      const isCompleted = goal > 0 && count >= goal;
      
      const wrapper = document.createElement("div");
      wrapper.className = "action-wrapper";
      wrapper.dataset.id = action.id;
      
      wrapper.innerHTML = `
        <div class="counter-card ${isCompleted ? 'completed' : ''}">
          <div class="card-left">
            <h2 class="counter-text">${action.text}</h2>
            ${goal > 0 ? `<span class="goal-text">${count} / ${goal}</span>` : ''}
            ${isCompleted ? `<span class="completed-label">${t.completed}</span>` : ''}
          </div>
          <div class="counter-badge">
            <span>${count}</span>
          </div>
          <div class="card-right">
            <button class="btn-edit-action" aria-label="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button class="btn-undo ${count === 0 ? 'hidden' : ''}" title="${this.translations[DB.getLang()].undo}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
          </div>
        </div>
      `;

      const card = wrapper.querySelector(".counter-card");
      card.onclick = () => App.registerClick(action.id);
      
      wrapper.querySelector(".btn-edit-action").onclick = (e) => {
        e.stopPropagation();
        this.showEditDialog(action.id);
      };

      wrapper.querySelector(".btn-undo").onclick = (e) => {
        e.stopPropagation();
        App.undoLastAction(action.id);
      };
      
      container.appendChild(wrapper);
    });
  },

  setupEventListeners() {
    const addActionBtn = document.getElementById("add-action-btn");
    if (addActionBtn) addActionBtn.onclick = () => this.showEditDialog();

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
      confirmAccept.onclick = () => DB.clearAll();
      confirmDialog.showModal();
    };

    confirmCancel.onclick = () => confirmDialog.close();

    const editSave = document.getElementById("edit-action-save");
    const editCancel = document.getElementById("edit-action-cancel");
    const editDialog = document.getElementById("edit-action-dialog");
    const editInput = document.getElementById("edit-action-input");
    const editGoalInput = document.getElementById("edit-action-goal");
    const editDelete = document.getElementById("edit-action-delete");

    document.getElementById("goal-minus").onclick = () => {
      const val = parseInt(editGoalInput.value) || 0;
      if (val > 0) editGoalInput.value = val - 1;
    };

    document.getElementById("goal-plus").onclick = () => {
      const val = parseInt(editGoalInput.value) || 0;
      if (val < 99) editGoalInput.value = val + 1;
    };

    editCancel.onclick = () => editDialog.close();
    editDelete.onclick = () => {
      confirmAccept.onclick = async () => {
        await DB.deleteAction(this.currentEditingId);
        await this.renderMain();
        confirmDialog.close();
        editDialog.close();
      };
      confirmDialog.showModal();
    };

    editSave.onclick = async () => {
      const text = editInput.value.trim();
      // Ensure the goal is at least 0
      const goal = Math.max(0, parseInt(editGoalInput.value) || 0);
      if (text) {
        let actions = await DB.getActions();
        if (this.currentEditingId) {
          const action = actions.find(a => a.id === this.currentEditingId);
          if (action) {
            action.text = text;
            action.goal = goal;
          }
        } else {
          actions.push({ id: Date.now(), text, goal });
        }
        await DB.saveActions(actions);
        await this.renderMain();
        editDialog.close();
      }
    };

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
    
    document.getElementById("edit-dialog-title").textContent = t.editAction;
    document.getElementById("edit-action-input").placeholder = t.editPlaceholder;
    document.getElementById("label-edit-goal").textContent = t.editGoal;
    document.getElementById("edit-action-cancel").textContent = t.cancel;
    document.getElementById("edit-action-save").textContent = t.accept;
    document.getElementById("history-today-btn").textContent = t.today;
    document.getElementById("weekly-today-btn").textContent = t.today;
    document.getElementById("monthly-today-btn").textContent = t.today;
  },

  applyDarkMode() {
    const isDark = DB.getDarkMode();
    document.body.classList.toggle("dark-mode", isDark);
  },

  async showEditDialog(actionId = null) {
    this.currentEditingId = actionId;
    const dialog = document.getElementById("edit-action-dialog");
    const input = document.getElementById("edit-action-input");
    const goalInput = document.getElementById("edit-action-goal");
    const deleteBtn = document.getElementById("edit-action-delete");
    const title = document.getElementById("edit-dialog-title");
    const t = this.translations[DB.getLang()];

    if (actionId) {
      const actions = await DB.getActions();
      const action = actions.find(a => a.id === actionId);
      input.value = action ? action.text : "";
      goalInput.value = action ? (action.goal || 0) : 0;
      title.textContent = t.editAction;
      deleteBtn.classList.remove("hidden");
    } else {
      input.value = "";
      goalInput.value = 0;
      title.textContent = t.addAction;
      deleteBtn.classList.add("hidden");
    }
    dialog.showModal();
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

    // Toggle FAB visibility: only show on main view
    const fab = document.getElementById("add-action-btn");
    if (fab) {
      fab.classList.toggle("hidden", viewName !== "main");
    }

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

  animateClick(actionId) {
    const wrapper = document.querySelector(`.action-wrapper[data-id="${actionId}"]`);
    if (!wrapper) return;

    const card = wrapper.querySelector(".counter-card");
    const badge = card.querySelector(".counter-badge");
    const countEl = badge.querySelector("span");

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
