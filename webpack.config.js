const path = require('path')

module.exports = {
  module: {
    rules: [
      { test: /\.jsx$/,
        use: [{ loader: 'babel-loader', options: { cacheDirectory: 'tmp/babel-loader-cache' } }],
        exclude: '/node_modules'
      }
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'static/js'), 'node_modules']
  }
}
