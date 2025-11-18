const path = require("path");
const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    "process/browser": require.resolve("process/browser"),
    process: require.resolve("process/browser.js"),
    "@react-native-async-storage/async-storage": path.resolve(
      __dirname,
      "src",
      "utils",
      "AsyncStorage.js"
    ),
  };
  
  config.resolve.extensions = Array.from(new Set([...(config.resolve.extensions || []), ".mjs", ".js", ".json"]));
  config.resolve.mainFields = ["browser", "module", "main"];
  
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer/"),
    util: require.resolve("util/"),
    url: require.resolve("url/"),
    zlib: require.resolve("browserify-zlib"),
    assert: require.resolve("assert/"),
    process: require.resolve("process/browser"),
    os: require.resolve("os-browserify/browser"),
    path: require.resolve("path-browserify"),
    crypto: require.resolve("crypto-browserify"),
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ]);

  return config;
};
