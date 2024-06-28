const { resolve } = require('path');
const { merge } = require('webpack-merge');
const { getPlugins } = require('./utils');

module.exports = merge(require('./webpack.base'), {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.less$/i,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
    ],
  },
  plugins: getPlugins(1),
  devServer: {
    static: {
      directory: resolve(__dirname, '..', 'src'),
    },
    compress: true,
    port: 55556,
    open: true,
    // hot: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://127.0.0.1:55555',
      },
    ],
  },
  mode: 'development',
  devtool: 'source-map',
});
