document.addEventListener("DOMContentLoaded", async () => {
  try {
    await App.init();
    // Registro del Service Worker y gestión de actualizaciones
    if ("serviceWorker" in navigator) {
      App._setupServiceWorker();
    }
  } catch (error) {
    console.error("Critical error during app startup:", error);
  }
});

const App = {
  /**
   * Inicializa la aplicación: migración, carga de datos, UI y componentes.
   */
  async init() {
    // 1. Preparación de datos y compatibilidad
    await DB.migrateFromLocalStorage();
    
    // 2. Bloqueo por PIN
    UI.updateLanguageStrings(); // Asegurar idioma para la pantalla de PIN
    const pinExists = !!DB.getPasscode();
    await UI.showPasscodeLock(pinExists);

    await this._ensureInitialData();

    // 3. Inicialización de la interfaz
    await UI.renderMain();
    UI.setupEventListeners();
    
    // 4. Carga de módulos secundarios
    await Calendar.init();
    
    // 5. Mostrar vista inicial
    UI.showView('main');
  },

  /**
   * Configura el Service Worker y detecta actualizaciones.
   */
  _setupServiceWorker() {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      // 1. Si ya hay un worker esperando desde una sesión anterior
      if (reg.waiting) {
        this._notifyUpdate(reg.waiting);
      }

      // 2. Si hay un worker instalándose, esperar a que termine
      if (reg.installing) {
        this._trackInstallation(reg.installing);
      }

      // 3. Detectar futuras actualizaciones
      reg.addEventListener("updatefound", () => {
        this._trackInstallation(reg.installing);
      });

      // Comprobar actualizaciones manualmente al enfocar la app
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update();
      });
    });

    // Recargar la página cuando el nuevo service worker tome el control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  },

  /**
   * Rastrea el estado de una instalación en curso.
   */
  _trackInstallation(worker) {
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        this._notifyUpdate(worker);
      }
    });
  },

  /**
   * Notifica al usuario que hay una actualización disponible.
   */
  _notifyUpdate(worker) {
    UI.showUpdateToast(() => {
      worker.postMessage({ type: "SKIP_WAITING" });
    });
  },

  /**
   * Lógica de recuperación para garantizar que siempre haya al menos una acción 
   * si existen eventos huérfanos o la base de datos está vacía.
   */
  async _ensureInitialData() {
    const actions = await DB.getActions();
    const events = await DB.getEvents();

    if (actions.length === 0) {
      // Si no hay acciones pero hay eventos, recuperamos el ID del primero para no perder la vinculación
      const firstEvent = events[0];
      const recoveryId = firstEvent ? firstEvent.actionId : Date.now();
      
      const defaultActions = [{ id: recoveryId, text: "Acción" }];
      await DB.saveActions(defaultActions);
    }
  },

  async registerClick(actionId) {
    const actions = await DB.getActions();
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const now = new Date();
    const event = {
      id: Date.now(),
      actionId: action.id,
      actionText: action.text,
      ...Utils.formatTimestamp(now),
    };

    await DB.addEvent(event);
    await UI.renderMain();
    UI.animateClick(actionId);
  },

  async undoLastAction(actionId) {
    if (await DB.removeLastEvent(actionId)) {
      await UI.renderMain();
    }
  },
};
