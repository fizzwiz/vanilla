const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, "src/main/index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "gaia.bundle.js",
    library: "gaia",
    libraryTarget: "umd"
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  target: "web", // ✅ optional but explicit
  mode: "production"
};
