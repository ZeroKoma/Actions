const UI = {
  renderMain() {
    const config = DB.getConfig();
    const events = DB.getEvents();

    document.getElementById("main-count").textContent = events.length;

    const undoBtn = document.getElementById("undo-button");
    if (undoBtn) {
      undoBtn.classList.toggle("hidden", events.length === 0);
    }

    const img = document.getElementById("display-image");
    if (config.image) {
      img.src = config.image;
      img.classList.remove("hidden");
    }
  },

  setupEventListeners() {
    document.getElementById("counter-trigger").onclick = () =>
      App.registerClick();

    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmAccept = document.getElementById("confirm-accept");
    const confirmCancel = document.getElementById("confirm-cancel");

    document.getElementById("reset-app").onclick = () => {
      confirmDialog.showModal();
    };

    confirmAccept.onclick = () => DB.clearAll();
    confirmCancel.onclick = () => confirmDialog.close();

    const undoBtn = document.getElementById("undo-button");
    if (undoBtn) {
      undoBtn.onclick = () => App.undoLastAction();
    }
  },

  showView(viewName) {
    const viewTitles = {
      main: "Principal",
      weekly: "Semanal",
      monthly: "Mensual",
      history: "Historial",
      settings: "Ajustes",
    };

    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.add("hidden"));
    document.getElementById(`view-${viewName}`).classList.remove("hidden");
    document.getElementById("app-title").textContent = viewTitles[viewName] || "Acciones";

    // Actualizar datos de calendarios al cambiar de vista
    if (viewName === "weekly") Calendar.renderWeekly();
    if (viewName === "monthly") Calendar.renderMonthly();
    if (viewName === "history") Calendar.renderHistory();

    // Actualizar estado activo en el menú
    document.querySelectorAll(".menu-links button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });
  },

  animateClick() {
    const card = document.getElementById("counter-trigger");
    const badge = card.querySelector(".counter-badge");
    const countEl = document.getElementById("main-count");

    // Animación de escala en la tarjeta
    card.style.transform = "scale(0.95)";
    setTimeout(() => (card.style.transform = "scale(1)"), 100);

    // Animación "pop" en el número
    countEl.classList.remove("pop-animation");
    void countEl.offsetWidth; // Forzar reflujo para reiniciar animación
    countEl.classList.add("pop-animation");

    // Crear indicador +1 flotante
    const indicator = document.createElement("span");
    indicator.textContent = "+1";
    indicator.className = "click-indicator";
    badge.appendChild(indicator);

    // Limpiar el indicador después de la animación
    setTimeout(() => indicator.remove(), 800);
  },
};
