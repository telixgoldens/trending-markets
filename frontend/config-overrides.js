module.exports = function override(config) {
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    "@react-native-async-storage/async-storage": require("path").resolve(__dirname, "src/utils/AsyncStorage.js"),
  };
  return config;
};
