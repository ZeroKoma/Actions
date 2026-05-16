document.addEventListener("DOMContentLoaded", () => {
  let actions = DB.getActions();
  
  // Migration logic
  const oldConfig = JSON.parse(localStorage.getItem("app_config"));
  if (oldConfig && actions.length === 0) {
    actions = [{ id: Date.now(), ...oldConfig }];
    DB.saveActions(actions);
    localStorage.removeItem("app_config");
  }

  if (actions.length === 0) {
    actions = [{ id: Date.now(), text: "Acción" }];
    DB.saveActions(actions);
  }

  // Event migration
  const events = DB.getEvents();
  if (events.length > 0 && !events[0].actionId) {
    const firstId = actions[0].id;
    events.forEach(e => e.actionId = firstId);
    localStorage.setItem("app_events", JSON.stringify(events));
  }

  App.init();
});

const App = {
  init() {
    UI.renderMain();
    UI.setupEventListeners();
    Calendar.init();
    UI.showView('main');
  },

  registerClick(actionId) {
    const actions = DB.getActions();
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const now = new Date();
    const event = {
      id: Date.now(),
      actionId: action.id,
      actionText: action.text,
      ...Utils.formatTimestamp(now),
    };

    DB.addEvent(event);
    UI.renderMain();
    UI.animateClick(actionId);
  },

  undoLastAction(actionId) {
    if (DB.removeLastEvent(actionId)) {
      UI.renderMain();
    }
  },
};
