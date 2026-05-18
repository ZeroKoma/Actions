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
      goalPrefix: "Objetivo: ",
      completed: "¡Completado!",
      manualTitle: "Registro Manual",
      labelAction: "Acción",
      labelDate: "Fecha",
      labelTime: "Hora",
      labelActiveDays: "Días objetivo",
      daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
      allDays: "Todos los días",
      selectAll: "Todos",
      selectWeekdays: "Lun-Vie",
      selectWeekends: "S-D",
      editEntry: "Editar registro",
      entrySaved: "¡Registro guardado!",
      updateAvailable: "Nueva versión disponible. Toca para actualizar.",
      createPin: "Crea tu código PIN",
      enterPin: "Introduce tu PIN",
      incorrectPin: "PIN incorrecto",
      labelData: "Copia de seguridad",
      export: "Exportar JSON",
      import: "Importar JSON",
      importSuccess: "¡Datos importados con éxito!",
      importError: "Error al importar el archivo.",
      invalidFile: "El archivo no pertenece a esta aplicación.",
      importTitle: "Importar datos",
      importBody: "Elige cómo quieres procesar el archivo:",
      importMerge: "Fusionar con actuales",
      importOverwrite: "Sobrescribir todo",
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
      goalPrefix: "Goal: ",
      completed: "Completed!",
      manualTitle: "Manual Entry",
      labelAction: "Action",
      labelDate: "Date",
      labelTime: "Time",
      labelActiveDays: "Target days",
      daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      allDays: "Every day",
      selectAll: "All",
      selectWeekdays: "Mon-Fri",
      selectWeekends: "Wknd",
      editEntry: "Edit entry",
      entrySaved: "Entry saved!",
      updateAvailable: "New version available. Tap to update.",
      createPin: "Create your PIN",
      enterPin: "Enter your PIN",
      incorrectPin: "Incorrect PIN",
      labelData: "Backup & Restore",
      export: "Export JSON",
      import: "Import JSON",
      importSuccess: "Data imported successfully!",
      importError: "Error importing file.",
      invalidFile: "The file does not belong to this application.",
      importTitle: "Import Data",
      importBody: "Choose how to process the file:",
      importMerge: "Merge with current",
      importOverwrite: "Overwrite all",
    }
  },

  currentEditingId: null,

  async renderMain() {
    this.applyDarkMode();
    this.updateLanguageStrings();
    const actions = await DB.getActions();
    const events = await DB.getEvents();
    const today = Utils.getTodayKey();
    const dayOfWeek = new Date().getDay();
    const container = document.getElementById("actions-container");
    if (!container) return;
    
    container.innerHTML = "";
    const lang = DB.getLang();
    const t = this.translations[lang];

    actions.forEach(action => {
      const todayEvents = events.filter(e => e.actionId === action.id && e.date === today);
      const count = todayEvents.length;
      const isCompleted = this._checkCompletion(action, count, dayOfWeek);
      const daysText = this._getDaysText(action, dayOfWeek, t, lang);

      const wrapper = this._createActionElement(action, count, isCompleted, daysText, t);

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

  /**
   * Helper para verificar si se ha cumplido la meta del día.
   */
  _checkCompletion(action, count, dayOfWeek) {
    const goal = action.goal || 0;
    const activeDays = action.activeDays || [];
    const isTargetDay = activeDays.length === 0 || activeDays.includes(dayOfWeek);
    return isTargetDay && goal > 0 && count >= goal;
  },

  /**
   * Genera el texto descriptivo de los días activos.
   */
  _getDaysText(action, dayOfWeek, t, lang) {
    const activeDays = action.activeDays || [];
    const isAllDays = activeDays.length === 0 || activeDays.length === 7;
    
    if (isAllDays) {
      const isTargetToday = activeDays.length === 0 || activeDays.includes(dayOfWeek);
      return isTargetToday ? `<span class="is-today">${t.allDays}</span>` : t.allDays;
    }

    return [...activeDays]
      .sort((a, b) => {
        const order = lang === 'es' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
        return order.indexOf(a) - order.indexOf(b);
      })
      .map(idx => idx === dayOfWeek ? `<span class="is-today">${t.daysShort[idx]}</span>` : t.daysShort[idx])
      .join(", ");
  },

  /**
   * Crea el elemento DOM para una acción.
   */
  _createActionElement(action, count, isCompleted, daysText, t) {
    const goal = action.goal || 0;
    const wrapper = document.createElement("div");
    wrapper.className = "action-wrapper";
    wrapper.dataset.id = action.id;
    
    wrapper.innerHTML = `
      <div class="counter-card ${isCompleted ? 'completed' : ''}">
        <div class="card-row">
          <h2 class="counter-text">${action.text}</h2>
          <div class="counter-badge">
            <span>${count}</span>
          </div>
        </div>
        <div class="card-row">
          <span class="active-days-info">${daysText}</span>
        </div>
        <div class="card-row">
          <div class="goal-info">
            ${goal > 0 ? `<span class="goal-text">${t.goalPrefix}${count} / ${goal}</span>` : ''}
            ${isCompleted ? `<span class="completed-label">${t.completed}</span>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn-undo ${count === 0 ? 'hidden' : ''}" title="${t.undo}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
            <button class="btn-edit-action" aria-label="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    return wrapper;
  },

  setupEventListeners() {
    const addActionBtn = document.getElementById("add-action-btn");
    if (addActionBtn) addActionBtn.onclick = () => this.showEditDialog();
    this._initDialogHandlers();

    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmAccept = document.getElementById("confirm-accept");
    const confirmCancel = document.getElementById("confirm-cancel");
    const langSwitch = document.getElementById("lang-switch");
    const darkSwitch = document.getElementById("dark-switch");

    if (langSwitch) {
      langSwitch.checked = DB.getLang() === "en";
      langSwitch.onchange = async (e) => {
        DB.setLang(e.target.checked ? "en" : "es");
        this.updateLanguageStrings();
        await Calendar.init(); // Reset calendar to update days
        await this.renderMain(); // Re-render logic for cards with new language
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

    // Export / Import Handlers
    document.getElementById("btn-export").onclick = async () => {
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = Utils.getBackupFileName();
      a.click();
      URL.revokeObjectURL(url);
    };

    const fileInput = document.getElementById("import-file-input");
    document.getElementById("btn-import").onclick = () => fileInput.click();

    const importOptionsDialog = document.getElementById("import-options-dialog");

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          const t = this.translations[DB.getLang()];

          // 1. Validar firma de la aplicación antes de mostrar opciones
          if (data.appId !== "ActionCounter") {
            this._showToast(t.invalidFile);
            fileInput.value = ""; // Limpiar input
            return;
          }
          
          document.getElementById("import-merge-btn").onclick = async () => {
            try {
              await DB.importAll(data, true);
              location.reload();
            } catch (err) {
              this._showToast(t.importError);
            }
          };
          
          document.getElementById("import-overwrite-btn").onclick = async () => {
            try {
              await DB.importAll(data, false);
              location.reload();
            } catch (err) {
              this._showToast(t.importError);
            }
          };

          document.getElementById("import-cancel-btn").onclick = () => importOptionsDialog.close();
          
          importOptionsDialog.showModal();
        } catch (err) {
          this._showToast(this.translations[DB.getLang()].importError);
        }
      };
      reader.readAsText(file);
    };

    confirmCancel.onclick = () => confirmDialog.close();

    // Navigation gestures
    this._setupTouchGestures();
  },

  /**
   * Centraliza los manejadores de los botones de acción de los diálogos.
   */
  _initDialogHandlers() {
    const editSave = document.getElementById("edit-action-save");
    const editDialog = document.getElementById("edit-action-dialog");
    const editDelete = document.getElementById("edit-action-delete");
    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmAccept = document.getElementById("confirm-accept");

    // Handlers para el diálogo de edición de acciones
    document.getElementById("goal-minus").onclick = () => {
      const editGoalInput = document.getElementById("edit-action-goal");
      const val = parseInt(editGoalInput.value) || 0;
      if (val > 0) editGoalInput.value = val - 1;
    };

    document.getElementById("goal-plus").onclick = () => {
      const editGoalInput = document.getElementById("edit-action-goal");
      const val = parseInt(editGoalInput.value) || 0;
      if (val < 99) editGoalInput.value = val + 1;
    };

    document.getElementById("edit-action-cancel").onclick = () => editDialog.close();

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
      const text = document.getElementById("edit-action-input").value.trim();
      const editGoalInput = document.getElementById("edit-action-goal");
      const goal = Math.max(0, parseInt(editGoalInput.value) || 0);
      
      const activeDays = [];
      document.querySelectorAll(".day-chip.active").forEach(chip => {
        activeDays.push(parseInt(chip.dataset.day));
      });

      if (text) {
        let actions = await DB.getActions();
        if (this.currentEditingId) {
          const action = actions.find(a => a.id === this.currentEditingId);
          if (action) {
            action.text = text;
            action.goal = goal;
            action.activeDays = activeDays;
          }
        } else {
          actions.push({ id: Date.now(), text, goal, activeDays });
        }
        await DB.saveActions(actions);
        await this.renderMain();
        editDialog.close();
      }
    };

    // Manual Entry listeners
    const manualDialog = document.getElementById("manual-entry-dialog");
    const manualBtn = document.getElementById("btn-manual-entry");
    if (manualBtn) manualBtn.onclick = () => this.showManualEntryDialog();
    
    document.getElementById("manual-cancel").onclick = () => manualDialog.close();
    document.getElementById("manual-save").onclick = () => this._handleManualSave();
  },

  /**
   * Configura los gestos táctiles para la navegación horizontal.
   */
  _setupTouchGestures() {
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

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
        const viewsOrder = ["main", "history", "weekly", "monthly", "settings"];
        const activeView = document.querySelector(".view:not(.hidden)");
        if (!activeView) return;
        
        const currentViewName = activeView.id.replace("view-", "");
        const currentIndex = viewsOrder.indexOf(currentViewName);

        if (dx < 0 && currentIndex < viewsOrder.length - 1) {
          this.showView(viewsOrder[currentIndex + 1]);
        } else if (dx > 0 && currentIndex > 0) {
          this.showView(viewsOrder[currentIndex - 1]);
        }
      }
    }, { passive: true });
  },

  /**
   * Muestra un toast persistente para la actualización del PWA.
   */
  showUpdateToast(callback) {
    // Evitar duplicados si ya existe un toast de actualización
    if (document.querySelector(".update-toast")) return;

    const lang = DB.getLang();
    const t = this.translations[lang];
    const toast = document.createElement("div");
    toast.className = "update-toast";
    toast.style.cursor = "pointer";
    toast.textContent = t.updateAvailable;
    
    toast.onclick = () => {
      callback();
      toast.remove();
    };

    document.body.appendChild(toast);
  },

  /**
   * Gestiona el guardado de una entrada manual.
   */
  async _handleManualSave() {
    const actionId = Number(document.getElementById("manual-action-select").value);
    const dateVal = document.getElementById("manual-date-input").value;
    const timeVal = document.getElementById("manual-time-input").value;
    const t = this.translations[DB.getLang()];

    if (actionId && dateVal && timeVal) {
      const actions = await DB.getActions();
      const action = actions.find(a => a.id === actionId);
      
      const tempDate = new Date(`${dateVal}T12:00:00`);
      const formattedDate = Utils.formatDate(tempDate);
      const fullIso = new Date(`${dateVal}T${timeVal}`).toISOString();

      const event = {
        id: Date.now(),
        actionId: action.id,
        actionText: action.text,
        full: fullIso,
        date: formattedDate,
        time: timeVal
      };

      await DB.addEvent(event);
      
      Calendar.selectedWeeklyActionId = action.id;
      Calendar.selectedMonthlyActionId = action.id;

      await this.renderMain();
      await Calendar.renderAll();
      
      this._showToast(t.entrySaved);

      document.getElementById("manual-entry-dialog").close();
    }
  },

  _showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "update-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
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
    document.getElementById("manual-dialog-title").textContent = t.manualTitle;
    document.getElementById("label-manual-action").textContent = t.labelAction;
    document.getElementById("label-manual-date").textContent = t.labelDate;
    document.getElementById("label-manual-time").textContent = t.labelTime;
    document.getElementById("manual-cancel").textContent = t.cancel;
    document.getElementById("manual-save").textContent = t.accept;

    document.getElementById("label-data").textContent = t.labelData;
    document.getElementById("text-export").textContent = t.export;
    document.getElementById("text-import").textContent = t.import;

    document.getElementById("import-title").textContent = t.importTitle;
    document.getElementById("import-body").textContent = t.importBody;
    document.getElementById("import-merge-btn").textContent = t.importMerge;
    document.getElementById("import-overwrite-btn").textContent = t.importOverwrite;
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
    const lang = DB.getLang();
    const t = this.translations[lang];

    const actions = await DB.getActions();
    const action = actionId ? actions.find(a => a.id === actionId) : null;
    
    input.value = action ? action.text : "";
    goalInput.value = action ? (action.goal || 0) : 0;

    this._renderDayPicker(action, t, lang);

    if (actionId) {
      title.textContent = t.editAction;
      deleteBtn.classList.remove("hidden");
    } else {
      title.textContent = t.addAction;
      deleteBtn.classList.add("hidden");
    }
    dialog.showModal();
  },

  _renderDayPicker(action, t, lang) {
    let dayPickerContainer = document.getElementById("day-picker-container");
    if (!dayPickerContainer) {
      dayPickerContainer = document.createElement("div");
      dayPickerContainer.id = "day-picker-container";
      const goalInput = document.getElementById("edit-action-goal");
      if (!goalInput) return; // Seguridad: evitar error si el ID no existe
      
      const anchor = goalInput.closest(".settings-item") || goalInput.parentElement;
      if (anchor) anchor.after(dayPickerContainer);
    }

    dayPickerContainer.innerHTML = `
      <label class="settings-label" style="display:block; margin-top:12px;">${t.labelActiveDays}</label>
      <div class="quick-select-days" style="display:flex; gap:8px; margin-top:8px; margin-bottom:12px;">
        <button type="button" class="btn-secondary" style="font-size: 0.7rem; padding: 6px; flex:1;" id="btn-select-all">${t.selectAll}</button>
        <button type="button" class="btn-secondary" style="font-size: 0.7rem; padding: 6px; flex:1;" id="btn-select-weekdays">${t.selectWeekdays}</button>
        <button type="button" class="btn-secondary" style="font-size: 0.7rem; padding: 6px; flex:1;" id="btn-select-weekends">${t.selectWeekends}</button>
      </div>
      <div class="day-picker" style="display:flex; gap:5px; margin-top:8px; justify-content: space-between;"></div>
    `;

    const picker = dayPickerContainer.querySelector(".day-picker");
    const dayOrder = lang === 'es' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];

    dayOrder.forEach(dayIdx => {
      const isActive = action && action.activeDays ? action.activeDays.includes(dayIdx) : false;
      const chip = document.createElement("button");
      chip.type = "button"; // Importante para que no envíe el formulario
      chip.className = `day-chip ${isActive ? 'active' : ''}`;
      chip.dataset.day = dayIdx;
      chip.textContent = t.daysShort[dayIdx];
      chip.onclick = () => chip.classList.toggle("active");
      picker.appendChild(chip);
    });

    // Lógica de selección rápida
    const setAllChips = (indices) => {
      picker.querySelectorAll(".day-chip").forEach(chip => {
        const dayIdx = parseInt(chip.dataset.day);
        chip.classList.toggle("active", indices.includes(dayIdx));
      });
    };

    dayPickerContainer.querySelector("#btn-select-all").onclick = () => setAllChips([0, 1, 2, 3, 4, 5, 6]);
    dayPickerContainer.querySelector("#btn-select-weekdays").onclick = () => setAllChips([1, 2, 3, 4, 5]);
    dayPickerContainer.querySelector("#btn-select-weekends").onclick = () => setAllChips([0, 6]);
  },

  async showManualEntryDialog(prefilledDate = null) {
    const actions = await DB.getActions();
    const select = document.getElementById("manual-action-select");
    const dateInput = document.getElementById("manual-date-input");
    const timeInput = document.getElementById("manual-time-input");
    
    // Fill actions dropdown
    select.innerHTML = actions.map(a => `<option value="${a.id}">${a.text}</option>`).join('');
    
    // Default to current date and time or use prefilled date from calendar
    const now = new Date();
    const targetDate = prefilledDate || now;
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    timeInput.value = now.toTimeString().slice(0, 5);
    
    document.getElementById("manual-entry-dialog").showModal();
  },

  async showEditEventDialog(eventId) {
    const events = await DB.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    let dialog = document.getElementById("edit-event-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "edit-event-dialog";
      dialog.className = "modal-dialog";
      document.body.appendChild(dialog);
    }

    const t = this.translations[DB.getLang()];
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>${t.editEntry}</h3>
        <div class="manual-form-fields">
          <label class="field-label">${t.labelTime}</label>
          <input type="time" id="edit-event-time" class="edit-input" value="${event.time}">
        </div>
        <div class="dialog-buttons">
          <button id="edit-event-delete" class="btn-icon-danger" title="${t.accept}">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
          <button id="edit-event-cancel" class="btn-secondary">${t.cancel}</button>
          <button id="edit-event-save" class="btn-primary-action">${t.accept}</button>
        </div>
      </div>
    `;

    document.getElementById("edit-event-cancel").onclick = () => dialog.close();
    
    document.getElementById("edit-event-delete").onclick = async () => {
      const confirmAccept = document.getElementById("confirm-accept");
      confirmAccept.onclick = async () => {
        await DB.deleteEvent(eventId);
        await Calendar.renderHistory();
        await this.renderMain();
        document.getElementById("confirm-dialog").close();
        dialog.close();
      };
      document.getElementById("confirm-dialog").showModal();
    };

    document.getElementById("edit-event-save").onclick = async () => {
      const newTime = document.getElementById("edit-event-time").value;
      if (newTime) {
        event.time = newTime;
        await DB.updateEvent(event);
        await Calendar.renderHistory();
        await this.renderMain();
        dialog.close();
      }
    };
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

    // Toggle Manual Entry visibility: hide on settings view
    const manualBtn = document.getElementById("btn-manual-entry");
    if (manualBtn) {
      manualBtn.classList.toggle("hidden", viewName === "settings");
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
    if (viewName === "main") this.renderMain();
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

  showPasscodeLock(isLocked) {
    return new Promise((resolve) => {
      const overlay = document.getElementById("passcode-screen");
      const dots = overlay.querySelectorAll(".dot");
      const msgEl = document.getElementById("passcode-msg");
      const t = this.translations[DB.getLang()];
      
      let input = "";
      overlay.classList.remove("hidden");
      msgEl.textContent = isLocked ? t.enterPin : t.createPin;

      const updateUI = () => {
        dots.forEach((dot, i) => dot.classList.toggle("filled", i < input.length));
      };

      const keypad = overlay.querySelector(".passcode-keypad");
      keypad.onclick = async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        if (btn.classList.contains("key")) {
          if (input.length < 4) {
            input += btn.textContent;
            updateUI();
            if (input.length === 4) {
              setTimeout(async () => {
                const saved = DB.getPasscode();
                const hashedInput = await Utils.hashText(input);

                if (!saved) {
                  DB.setPasscode(hashedInput);
                  overlay.classList.add("hidden");
                  resolve();
                } else if (hashedInput === saved || input === saved) {
                  // Si coincide el hash (o el texto plano para migración)
                  if (input === saved) {
                    // Migrar automáticamente de texto plano a hash
                    DB.setPasscode(hashedInput);
                  }
                  overlay.classList.add("hidden");
                  resolve();
                } else {
                  input = "";
                  updateUI();
                  msgEl.textContent = t.incorrectPin;
                  msgEl.classList.add("error-shake");
                  setTimeout(() => {
                    msgEl.classList.remove("error-shake");
                    msgEl.textContent = t.enterPin;
                  }, 600);
                }
              }, 250);
            }
          }
        } else if (btn.classList.contains("key-backspace")) {
          input = input.slice(0, -1);
          updateUI();
        }
      };
    });
  }
};
