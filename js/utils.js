const Utils = {
  VERSION: "4.3.7",

  getTodayKey: () => new Date().toLocaleDateString("es-ES"),

  formatTimestamp: (date) => {
    return {
      full: date.toISOString(),
      date: date.toLocaleDateString("es-ES"),
      time: date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  },
};
