const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './frontend-js/main.js',
  output: {
    filename: 'main-bundled.js',
    path: path.resolve(__dirname, 'public')
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}


/**
 *  1. install all these packages: 
 *      npm install webpack webpack-cli @babel/core @babel/preset-env babel-loader
 * 
 *  2. modify the  package json to run the web pack and ignore changes when 
 *     the fronten files are changed, avoiding reastard of the server.
 *          "watch": "nodemon db --ignore frontend-js --ignore public/ & webpack --watch",
 * 
 * 
 *  For team collaboration:
 *  npm concurrently 
 */
