const fs = require('fs')
const path = require('path')

const express = require('express')
const cookieParser = require('cookie-parser')
const cons = require('consolidate')
const csrf = require('csurf')
const ClipCollection = require('./models/clipCollection.js')
const Clip = require('./models/clip.js')
const config = require('./config.js')

const app = express()
app.engine('mustache', cons.mustache)
app.set('view engine', 'mustache')
app.set('views', path.join(__dirname, '../views'))

app.use(express.static(path.join(__dirname, '../static')))

app.use(express.json())

app.use(cookieParser())

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


const csrfOpts = {cookie: true}
if(config.env === "test") {
  csrfOpts.ignoreMethods = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE']
}

const csrfProtection = csrf(csrfOpts)

app.get(/^\/((?!api).)*$/, csrfProtection, (req, res, next) => {
  res.render('clip', { csrfToken: req.csrfToken() })
})

const dataDir = path.join(__dirname, 'data')

app.get('/api/collections/:id', csrfProtection, async (req, res, next) => {
  try {
    if(!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findById(req.params.id)
    if(!clipCollection) {
      res.status(404).end()
    } else {
      const clips = await Clip.find({clipCollection: clipCollection._id})
      res.json({ ...clipCollection.inspect(), ...{clips: clips} })
    }
  } catch(err) {
    next(err)
  }
})

app.post('/api/collections/:collection_id/clips', csrfProtection, (req, res, next) => {
  if(!/^[0-9a-fA-F]{24}$/.test(req.params.collection_id)) {
    res.status(404).end()
    return
  }
  
  ClipCollection.findById(req.params.collection_id)
    .then(collection => {
      if(!collection) {
        res.status(404).end()
      } else {
        collection.clips.push(req.body)
        return collection.save()
      }
    })
    .then(collection => {
      res.status(201).json(collection)
    })
    .catch(err => next(err))
})

app.get('/api/collections', csrfProtection, (req, res, next) => {
  const PageSize = 9
  
  let pageIndex = 0
  try {
    pageIndex = req.query.page ? (Number(req.query.page) - 1) : 0
  } catch(error) {
    pageIndex = 0
  }
  
  const countQuery = ClipCollection.countDocuments({})
  const findQuery = ClipCollection.find({}, null, { limit: PageSize, skip: pageIndex * PageSize })
  Promise.all([countQuery, findQuery])
    .then(results => {
      const [count, found] = results
      const pages = Math.floor(count / PageSize) + ((count % PageSize > 0) ? 1 : 0)
      
      res.json({
        total: count,
        pages: pages,
        page: pageIndex + 1,
        results: found
      })
    })
    .catch(err => { next(err) })
})

app.post('/api/collections', csrfProtection, (req, res, next) => {
  const clipCollection = new ClipCollection({name: ""})
  clipCollection.save()
    .then(collection => res.status(201).json(collection))
    .catch(err => { next(err) })
})


module.exports = app
