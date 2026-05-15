const DB = {
  saveConfig: (config) =>
    localStorage.setItem("app_config", JSON.stringify(config)),
  getConfig: () => JSON.parse(localStorage.getItem("app_config")),

  addEvent: (event) => {
    const events = DB.getEvents();
    events.push(event);
    localStorage.setItem("app_events", JSON.stringify(events));
  },

  getEvents: () => JSON.parse(localStorage.getItem("app_events")) || [],

  removeLastEvent: () => {
    const events = DB.getEvents();
    if (events.length > 0) {
      events.pop();
      localStorage.setItem("app_events", JSON.stringify(events));
      return true;
    }
    return false;
  },

  getLang: () => localStorage.getItem("app_lang") || "es",
  setLang: (lang) => localStorage.setItem("app_lang", lang),

  clearAll: () => {
    localStorage.clear();
    location.reload();
  },
};
