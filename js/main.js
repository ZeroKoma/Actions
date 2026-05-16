document.addEventListener("DOMContentLoaded", async () => {
  await DB.migrateFromLocalStorage();
  let actions = await DB.getActions();
  const events = await DB.getEvents();
  
  if (actions.length === 0 && events.length === 0) {
    // If we have orphaned events, use the ID of the first one found
    const firstEvent = events[0];
    const recoveryId = firstEvent ? firstEvent.actionId : Date.now();
    
    actions = [{ id: recoveryId, text: "Acción" }];
    await DB.saveActions(actions);
  }

  App.init();
});

const App = {
  async init() {
    await UI.renderMain();
    UI.setupEventListeners();
    await Calendar.init();
    UI.showView('main');
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
