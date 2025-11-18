const AsyncStorage = {
  async getItem(key) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? null : JSON.parse(v);
    } catch (e) {
      console.warn("AsyncStorage.getItem error", e);
      return null;
    }
  },
  async setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("AsyncStorage.setItem error", e);
    }
  },
  async removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("AsyncStorage.removeItem error", e);
    }
  },
  async clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("AsyncStorage.clear error", e);
    }
  },
};

export default AsyncStorage;
