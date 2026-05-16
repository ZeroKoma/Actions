const DB = {
  saveActions: (actions) =>
    localStorage.setItem("app_actions", JSON.stringify(actions)),
  getActions: () => JSON.parse(localStorage.getItem("app_actions")) || [],

  addEvent: (event) => {
    const events = DB.getEvents();
    events.push(event);
    localStorage.setItem("app_events", JSON.stringify(events));
  },

  getEvents: () => JSON.parse(localStorage.getItem("app_events")) || [],

  removeLastEvent: (actionId) => {
    const events = DB.getEvents();
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].actionId === actionId) {
        events.splice(i, 1);
        localStorage.setItem("app_events", JSON.stringify(events));
        return true;
      }
    }
    return false;
  },

  getLang: () => localStorage.getItem("app_lang") || "es",
  setLang: (lang) => localStorage.setItem("app_lang", lang),

  getDarkMode: () => localStorage.getItem("app_dark_mode") === "true",
  setDarkMode: (isDark) => localStorage.setItem("app_dark_mode", isDark),

  clearAll: () => {
    localStorage.removeItem("app_actions");
    localStorage.removeItem("app_events");
    location.reload();
  },
};
