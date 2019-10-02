const csrf = require('csurf')
const config = require('./config.js')

const csrfOpts = {cookie: true}
if(config.env === "test") {
  csrfOpts.ignoreMethods = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE']
}

module.exports = csrf(csrfOpts)
