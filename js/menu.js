const Menu = {
  toggle: document.getElementById("menu-toggle"),
  close: document.getElementById("menu-close"),
  side: document.getElementById("side-menu"),
  overlay: document.getElementById("overlay"),

  init() {
    this.toggle.onclick = () => this.open();
    this.close.onclick = () => this.hide();
    this.overlay.onclick = () => this.hide();

    document.querySelectorAll(".menu-links button, .mobile-nav button").forEach((btn) => {
      btn.onclick = () => {
        UI.showView(btn.dataset.view);
        this.hide();
      };
    });
  },

  open() {
    this.side.classList.add("open");
    this.overlay.classList.add("active");
  },

  hide() {
    this.side.classList.remove("open");
    this.overlay.classList.remove("active");
  },
};
Menu.init();
