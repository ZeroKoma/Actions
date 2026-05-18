const Utils = {
  VERSION: "4.8.9",

  // Locale interno para claves de BD y formateo consistente.
  // No se debe cambiar para no romper la compatibilidad con datos existentes.
  _INTERNAL_LOCALE: "es-ES",

  /**
   * Devuelve la clave de fecha de hoy (DD/MM/YYYY).
   * @returns {string}
   */
  getTodayKey() {
    return this.formatDate(new Date());
  },

  /**
   * Formatea una fecha usando el locale interno.
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    return date.toLocaleDateString(this._INTERNAL_LOCALE);
  },

  /**
   * Normaliza una fecha a medianoche (00:00:00) para comparaciones precisas.
   * @param {Date|number|string} date
   * @returns {Date}
   */
  normalizeDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  formatTimestamp(date) {
    return {
      full: date.toISOString(),
      date: this.formatDate(date),
      time: date.toLocaleTimeString(this._INTERNAL_LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  },

  /**
   * Genera un hash SHA-256 de un texto.
   * @param {string} text 
   * @returns {Promise<string>}
   */
  async hashText(text) {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Genera el nombre del archivo de backup: actions_backup_lun-16-ago-2026.json
   */
  getBackupFileName() {
    const d = new Date();
    const parts = d.toLocaleDateString(this._INTERNAL_LOCALE, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toLowerCase().split(/[ ,.]+/).filter(Boolean);
    
    return `actions_backup_${parts.join('-')}.json`;
  }
};
