const Modal = {
  el: document.getElementById("setup-modal"),
  form: document.getElementById("setup-form"),

  showSetup() {
    this.el.classList.remove("hidden");
    this.form.onsubmit = async (e) => {
      e.preventDefault();
      const text = document.getElementById("input-text").value;
      const file = document.getElementById("input-image").files[0];
      let image = null;

      if (file) image = await Utils.resizeImage(file);

      DB.saveConfig({ text, image });
      this.el.classList.add("hidden");
      App.init();
    };
  },
};
