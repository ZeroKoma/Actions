document.addEventListener("DOMContentLoaded", async () => {
  try {
    await App.init();
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
    await this._ensureInitialData();

    // 2. Inicialización de la interfaz
    await UI.renderMain();
    UI.setupEventListeners();
    
    // 3. Carga de módulos secundarios
    await Calendar.init();
    
    // 4. Mostrar vista inicial
    UI.showView('main');
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
