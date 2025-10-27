import localforage from "localforage";

const AsyncStorage = {
  getItem: async (key) => localforage.getItem(key),
  setItem: async (key, value) => localforage.setItem(key, value),
  removeItem: async (key) => localforage.removeItem(key),
  clear: async () => localforage.clear(),
};

export default AsyncStorage;
