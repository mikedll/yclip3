const fs = require('fs')
const path = require('path')
const os = require('os')

const express = require('express')
const cookieParser = require('cookie-parser')
const cons = require('consolidate')
const underscore = require('underscore')
const cookieSession = require('cookie-session')
const fileupload = require('express-fileupload')

const User = require('./models/user.js')

const config = require('./config.js')

const app = express()
app.engine('mustache', cons.mustache)
app.set('view engine', 'mustache')
app.set('views', path.join(__dirname, '../views'))

const storageDir = path.join(__dirname, '../static/storage')

app.use(express.static(path.join(__dirname, '../static')))

app.use(express.json())

app.use(cookieParser())

app.use(cookieSession({
  name: 'yclip3session',
  keys: [config.cookieSecret],
  maxAge: 14 * 24 * 60 * 60 * 1000
}))

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileupload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../tmp/uploads'),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}));

const csrfProtection = require(path.join(__dirname, './csrfProtection.js'))
const mongoIdRegex = /^[0-9a-fA-F]{24}$/

app.get(/^\/((?!api).)*$/, csrfProtection, async (req, res, next) => {
  let user = null;
  
  if(req.session['userId']) {
    user = await User.findById(req.session['userId'])
  }
  
  res.render('index', {
    gaId: config.googleAnalyticsId,
    imageBucket: config.s3.bucket + '.s3.amazonaws.com',
    csrfToken: req.csrfToken(),
    googleClientId: config.googleClientId,
    user: user ? JSON.stringify(user) : "null"
  })
})

const sessionsApp = require('./sessions.js')
app.use('/api/sessions', sessionsApp)

const collectionsApp = require('./collections.js')
app.use('/api/collections', collectionsApp)

const meCollectionsApp = require('./meCollections.js')
app.use('/api/me/collections/', meCollectionsApp)

module.exports = app
