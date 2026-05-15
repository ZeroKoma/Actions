const Utils = {
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

  resizeImage: (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 200;
          let w = img.width,
            h = img.height;
          if (w > h) {
            if (w > MAX_SIZE) {
              h *= MAX_SIZE / w;
              w = MAX_SIZE;
            }
          } else {
            if (h > MAX_SIZE) {
              w *= MAX_SIZE / h;
              h = MAX_SIZE;
            }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },
};
