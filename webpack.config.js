const path = require('path')

const isProd = (process.env.NODE_ENV === 'production')

module.exports = {
  mode: isProd ? "production" : "development",
  entry: 'main.jsx',
  output: {
    path: path.resolve(__dirname, 'static/js')
  },
  module: {
    rules: [
      { test: /\.js(x)?$/,
        use: [{ loader: 'babel-loader', options: { cacheDirectory: 'tmp/babel-loader-cache' } }],
        exclude: '/node_modules/'
      }
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'client'), 'node_modules']
  },
  devtool: 'cheap-module-source-map'
}
