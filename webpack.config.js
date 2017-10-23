const path = require('path');
const config = require('./package.json');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

require('dotenv').config();

const PROD = process.env.NODE_ENV === 'production';

let plugins = [];

// PROD ? [
//     plugins.push(new webpack.optimize.UglifyJsPlugin({
//       compress: { warnings: false }
//     }))
//   ] : '';

module.exports = {
  entry: path.resolve(__dirname, config.main),

  target: 'node', // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder

  devtool: 'source-map',
  output: {
    library: process.env.NAME,
    libraryTarget: process.env.TARGET,
    path: __dirname,
    filename: (PROD) ? 'dist/proponojs.min.js' : 'dist/proponojs.js'
  },
  module: {
    loaders: [
      { test: /\.es6?$/, exclude: /node_modules/, loader: 'babel'},
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  plugins: plugins
};
