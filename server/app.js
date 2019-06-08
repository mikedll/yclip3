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
      const clips = await Clip.find({clipCollection: clipCollection._id}).sort('createdAt')
      res.json({ ...clipCollection.inspect(), ...{clips: clips} })
    }
  } catch(err) {
    next(err)
  }
})


app.put('/api/collections/:collection_id', csrfProtection, async (req, res, next) => {
  try {
    if(!/^[0-9a-fA-F]{24}$/.test(req.params.collection_id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findById(req.params.collection_id)
    if(!clipCollection) {
      res.status(404).end()
    } else {
      clipCollection.name = req.body.name
      await clipCollection.save()
      const clips = await Clip.find({clipCollection: req.params.collection_id})
      res.status(200).json({...clipCollection.inspect(), ...{clips: clips}})
    }
  } catch(err) {
    next(err)
  }
})

app.delete('/api/collections/:id', csrfProtection, async (req, res, next) => {
  try {
    if(!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findById(req.params.id)
    if(!clipCollection) {
      res.status(404).end()
    } else {
      await ClipCollection.deleteOne({_id: clipCollection._id})
      res.status(200).end()
    }
  } catch(err) {
    next(err)
  }
})

app.post('/api/collections/:collection_id/clips', csrfProtection, async (req, res, next) => {
  try {
    if(!/^[0-9a-fA-F]{24}$/.test(req.params.collection_id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findById(req.params.collection_id)
    if(!clipCollection) {
      res.status(404).end()
    } else {
      let newClip = new Clip()
      newClip.clipCollection = req.params.collection_id
      newClip.vid = req.body.vid
      newClip.parseStartEnd(req.body.start, req.body.end)
      await newClip.save()
      const clips = await Clip.find({clipCollection: req.params.collection_id})
      res.status(201).json({...clipCollection.inspect(), ...{clips: clips}})
    }
  } catch(err) {
    next(err)
  }
})

app.get('/api/collections', csrfProtection, async (req, res, next) => {
  try {
    const PageSize = 9
    
    let pageIndex = 0
    try {
      pageIndex = req.query.page ? (Number(req.query.page) - 1) : 0
    } catch(error) {
      pageIndex = 0
    }
    
    const count = await ClipCollection.countDocuments({})
    const pages = Math.floor(count / PageSize) + ((count % PageSize > 0) ? 1 : 0)
    
    const found = await ClipCollection.find({}, null, { limit: PageSize, skip: pageIndex * PageSize })
    const clipPromises = found.map(found => {
      return Clip.find({clipCollection: found._id})
    })
    const associatedClips = await Promise.all(clipPromises)
    const foundObjs = found.map((collection, i) => { return {...collection.inspect(), ...{clips: associatedClips[i]} } } )

    res.json({
      total: count,
      pages: pages,
      page: pageIndex + 1,
      results: foundObjs
    })

  } catch (err) {
    next(err)
  }

})

app.post('/api/collections', csrfProtection, (req, res, next) => {
  const clipCollection = new ClipCollection({name: ""})
  clipCollection.save()
    .then(collection => res.status(201).json(collection))
    .catch(err => { next(err) })
})


module.exports = app
