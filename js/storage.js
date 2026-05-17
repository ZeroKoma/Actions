const DB = {
  DB_NAME: "ActionCounterDB",
  DB_VERSION: 1,
  db: null,
  _initPromise: null,

  async init() {
    if (this.db) return this.db;
    if (this._initPromise) return this._initPromise;

    this._initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("actions")) db.createObjectStore("actions", { keyPath: "id" });
        if (!db.objectStoreNames.contains("events")) {
          const eventStore = db.createObjectStore("events", { keyPath: "id" });
          eventStore.createIndex("actionId", "actionId", { unique: false });
          eventStore.createIndex("date", "date", { unique: false });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
    
    return this._initPromise;
  },

  /**
   * Helper privado para centralizar la gestión de transacciones.
   * @param {string|string[]} stores Nombre o nombres de los almacenes.
   * @param {string} mode "readonly" o "readwrite".
   * @param {function} callback Operación a realizar.
   */
  async _withTransaction(stores, mode, callback) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      const result = callback(tx);

      if (result instanceof IDBRequest) {
        result.onsuccess = () => resolve(result.result ?? (mode === "readonly" ? [] : undefined));
        result.onerror = (e) => reject(e.target.error);
      } else {
        tx.oncomplete = () => resolve(result);
      }
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  saveActions(actions) {
    return this._withTransaction("actions", "readwrite", (tx) => {
      const store = tx.objectStore("actions");
      store.clear();
      actions.forEach(action => store.add(action));
    });
  },

  getActions() {
    return this._withTransaction("actions", "readonly", (tx) => 
      tx.objectStore("actions").getAll()
    );
  },

  addEvent(event) {
    return this._withTransaction("events", "readwrite", (tx) => 
      tx.objectStore("events").add(event)
    );
  },

  getEvents() {
    return this._withTransaction("events", "readonly", (tx) => 
      tx.objectStore("events").getAll()
    );
  },

  updateEvent(event) {
    return this._withTransaction("events", "readwrite", (tx) => 
      tx.objectStore("events").put(event)
    );
  },

  deleteEvent(eventId) {
    return this._withTransaction("events", "readwrite", (tx) => 
      tx.objectStore("events").delete(eventId)
    );
  },

  removeLastEvent(actionId) {
    return this._withTransaction("events", "readwrite", (tx) => {
      const store = tx.objectStore("events");
      const req = store.index("actionId").openCursor(IDBKeyRange.only(actionId), "prev");
      return new Promise((res) => {
        req.onsuccess = (e) => {
          const cursor = e.target.result;
        if (cursor) {
            cursor.delete();
            res(true);
          } else res(false);
        };
      });
    });
  },

  deleteAction(actionId) {
    return this._withTransaction(["actions", "events"], "readwrite", (tx) => {
      tx.objectStore("actions").delete(actionId);
      const index = tx.objectStore("events").index("actionId");
      const req = index.openCursor(IDBKeyRange.only(actionId));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    });
  },

  // Settings remain in localStorage as they are small and needed synchronously at startup
  getLang: () => localStorage.getItem("app_lang") || "es",
  setLang: (lang) => localStorage.setItem("app_lang", lang),
  getDarkMode: () => localStorage.getItem("app_dark_mode") === "true",
  setDarkMode: (isDark) => localStorage.setItem("app_dark_mode", isDark),

  clearAll() {
    return this._withTransaction(["actions", "events"], "readwrite", (tx) => {
      tx.objectStore("actions").clear();
      tx.objectStore("events").clear();
      tx.oncomplete = () => location.reload();
    });
  },

  async migrateFromLocalStorage() {
    const oldActionsStr = localStorage.getItem("app_actions");
    const oldEventsStr = localStorage.getItem("app_events");
    const oldConfigStr = localStorage.getItem("app_config");

    if (!oldActionsStr && !oldEventsStr && !oldConfigStr) return;

    const oldActions = JSON.parse(oldActionsStr);
    const oldEvents = JSON.parse(oldEventsStr);
    const oldConfig = JSON.parse(oldConfigStr);

    // Use a fixed timestamp for fallback to ensure consistency
    let fallbackActionId = 1000000000000; 

    if (oldActions && oldActions.length > 0) {
      await this.saveActions(oldActions);
      fallbackActionId = oldActions[0].id;
    } else if (oldConfig) {
      await this.saveActions([{ id: fallbackActionId, ...oldConfig }]);
    }

    if (oldEvents) {
      const db = await this.init();
      const tx = db.transaction("events", "readwrite");
      const store = tx.objectStore("events");
      for (const e of oldEvents) {
        if (!e.actionId) e.actionId = fallbackActionId;
        store.add(e);
      }
      await new Promise((res) => (tx.oncomplete = res));
    }

    // Only remove if we got here without errors
    localStorage.removeItem("app_actions");
    localStorage.removeItem("app_events");
    localStorage.removeItem("app_config");
  },
};
