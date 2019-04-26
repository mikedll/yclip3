var nodeExternals = require('webpack-node-externals');
const path = require('path')

module.exports = {
  mode: "development",
  target: 'node',
  externals: [nodeExternals()],
  output: {
    // use absolute paths in sourcemaps (important for debugging via IDE)
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
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
    modules: [path.resolve(__dirname, 'static/js'), 'node_modules']
  },
  devtool: "inline-cheap-module-source-map"
}
