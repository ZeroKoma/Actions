document.addEventListener("DOMContentLoaded", () => {
  let config = DB.getConfig();
  
  // Modern sparkles SVG icon matching the theme color
  const defaultImage = `data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m12%203-1.912%205.813a2%202%200%200%201-1.275%201.275L3%2012l5.813%201.912a2%202%200%200%201%201.275%201.275L12%2021l1.912-5.813a2%202%200%200%201%201.275-1.275L21%2012l-5.813-1.912a2%202%200%200%201-1.275-1.275L12%203Z%22%2F%3E%3Cpath%20d%3D%22M5%203v4%22%2F%3E%3Cpath%20d%3D%22M19%2017v4%22%2F%3E%3Cpath%20d%3D%22M3%205h4%22%2F%3E%3Cpath%20d%3D%22M17%2019h4%22%2F%3E%3C%2Fsvg%3E`;

  // Initialize with generic config if it doesn't exist, is missing text, or has old defaults
  if (!config || !config.text || config.text === "Fumar" || config.image.length > 5000) {
    // Default configuration: Generic Action
    config = {
      text: "Acción",
      image: defaultImage,
    };
    DB.saveConfig(config);
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

  registerClick() {
    const config = DB.getConfig();
    const now = new Date();
    const event = {
      id: Date.now(),
      actionText: config.text,
      ...Utils.formatTimestamp(now),
    };

    DB.addEvent(event);
    UI.animateClick();
    UI.renderMain();
  },

  undoLastAction() {
    if (DB.removeLastEvent()) {
      UI.renderMain();
    }
  },
};
