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

  async saveActions(actions) {
    const db = await this.init();
    const tx = db.transaction("actions", "readwrite");
    const store = tx.objectStore("actions");
    store.clear();
    for (const action of actions) {
      const req = store.add(action);
      req.onerror = (e) => console.error("Error saving action:", e.target.error);
    }
    return new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async getActions() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("actions", "readonly");
      const request = tx.objectStore("actions").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async addEvent(event) {
    const db = await this.init();
    const tx = db.transaction("events", "readwrite");
    const req = tx.objectStore("events").add(event);
    req.onerror = (e) => console.error("Error adding event:", e.target.error);
    return new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async getEvents() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("events", "readonly");
      const request = tx.objectStore("events").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async updateEvent(event) {
    const db = await this.init();
    const tx = db.transaction("events", "readwrite");
    tx.objectStore("events").put(event);
    return new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async deleteEvent(eventId) {
    const db = await this.init();
    const tx = db.transaction("events", "readwrite");
    tx.objectStore("events").delete(eventId);
    return new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async removeLastEvent(actionId) {
    const db = await this.init();
    const tx = db.transaction("events", "readwrite");
    const store = tx.objectStore("events");
    const index = store.index("actionId");
    
    return new Promise((resolve) => {
      const request = index.openCursor(IDBKeyRange.only(actionId), "prev");
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          resolve(true);
        } else {
          resolve(false);
        }
      };
    });
  },

  async deleteAction(actionId) {
    const db = await this.init();
    const tx = db.transaction(["actions", "events"], "readwrite");
    
    // Delete the action
    tx.objectStore("actions").delete(actionId);
    
    // Delete all associated events (cleanup)
    const eventStore = tx.objectStore("events");
    const index = eventStore.index("actionId");
    const request = index.openCursor(IDBKeyRange.only(actionId));
    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    return new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  // Settings remain in localStorage as they are small and needed synchronously at startup
  getLang: () => localStorage.getItem("app_lang") || "es",
  setLang: (lang) => localStorage.setItem("app_lang", lang),
  getDarkMode: () => localStorage.getItem("app_dark_mode") === "true",
  setDarkMode: (isDark) => localStorage.setItem("app_dark_mode", isDark),

  async clearAll() {
    const db = await this.init();
    const tx = db.transaction(["actions", "events"], "readwrite");
    tx.objectStore("actions").clear();
    tx.objectStore("events").clear();
    tx.oncomplete = () => location.reload();
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
