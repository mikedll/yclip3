const path = require('path')

module.exports = {
  target: 'node',
  module: {
    rules: [
      { test: /\.js(x)?$/,
        use: [{ loader: 'babel-loader', options: { cacheDirectory: 'tmp/babel-loader-cache' } }],
        exclude: '/node_modules/'
      }
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'static/js'), 'node_modules']
  }
}
