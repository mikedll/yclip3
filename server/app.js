const fs = require('fs')
const path = require('path')

const express = require('express')
const cookieParser = require('cookie-parser')
const cons = require('consolidate')
const csrf = require('csurf')
const ClipCollection = require('./models/clipCollection.js')
const config = require('./config.js')

const app = express()
app.engine('mustache', cons.mustache)
app.set('view engine', 'mustache')
app.set('views', path.join(__dirname, '../views'))

app.use(express.static(path.join(__dirname, '../static')))

app.use(express.json())

app.use(cookieParser())

const csrfOpts = {cookie: true}
if(config.env === "test") {
  csrfOpts.ignoreMethods = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE']
}

const csrfProtection = csrf(csrfOpts)

app.get(/^\/((?!api).)*$/, csrfProtection, (req, res, next) => {
  const id = 1
  fs.readFile(path.join(__dirname, '../data', id + '.json'), {encoding: 'UTF-8'}, (err, content) => {
    if (err !== null) {
      next("unable to find root clips")
    } else {
      const clips = JSON.parse(content)
      res.render('clip', { bootstrap: JSON.stringify(clips), csrfToken: req.csrfToken() })
    }
  })  
})

const dataDir = path.join(__dirname, 'data')

app.get('/api/collection/:id', csrfProtection, (req, res, next) => {
  fs.readFile(path.join(dataDir, req.params.id + '.json'), {encoding: 'UTF-8'}, (err, content) => {
    if (err !== null) {
      next("unable to find clip " + req.params.id)
    } else {
      const collection = JSON.parse(content)
      res.json(collection)
    }  
  })
})

app.post('/api/collections/:collection_id/clips', csrfProtection, (req, res, next) => {
  ClipCollection.findById(req.params.collection_id)
    .then(collection => {
      collection.clips.push(req.body)
      return collection.save()
    })
    .then(collection => {
      res.status(201).json(collection)
    })
})

module.exports = app
