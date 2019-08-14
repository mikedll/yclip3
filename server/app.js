const fs = require('fs')
const path = require('path')

const express = require('express')
const cookieParser = require('cookie-parser')
const cons = require('consolidate')
const csrf = require('csurf')
const ClipCollection = require('./models/clipCollection.js')
const Clip = require('./models/clip.js')
const User = require('./models/user.js')
const config = require('./config.js')
const { OAuth2Client } = require('google-auth-library')
const cookieSession = require('cookie-session')

const app = express()
app.engine('mustache', cons.mustache)
app.set('view engine', 'mustache')
app.set('views', path.join(__dirname, '../views'))

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


const csrfOpts = {cookie: true}
if(config.env === "test") {
  csrfOpts.ignoreMethods = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE']
}

const csrfProtection = csrf(csrfOpts)

app.get(/^\/((?!api).)*$/, csrfProtection, (req, res, next) => {
  res.render('index', { csrfToken: req.csrfToken(), googleClientId: config.googleClientId })
})

const dataDir = path.join(__dirname, 'data')

const idRegex = /^[0-9a-fA-F]{24}$/

app.post('/api/signin', async(req, res, next) => {
  const client = new OAuth2Client(config.googleClientId)
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: config.googleClientId
    })

    const payload = ticket.getPayload()

    let user = await User.findOne({vendor: 'Google', vendorId: payload['sub']})
    if(!user) {
      user = new User({
        vendor: 'Google',
        vendorId: payload['sub'],
        name: payload['name'],
        email: payload['email']
      })
      await user.save()
    }    
    req.session['userId'] = user._id

    res.json(user)
  } catch(err) {
    console.error(err)
    next(err)
  }
})

app.get('/api/collections/:id', csrfProtection, async (req, res, next) => {
  try {
    if(!idRegex.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findById(req.params.id)
    if(!clipCollection) {
      res.status(404).end()
    } else {
      const clips = await Clip.find().forCollection(clipCollection._id)
      res.json({ ...clipCollection.inspect(), ...{clips: clips} })
    }
  } catch(err) {
    next(err)
  }
})

app.put('/api/collections/:collection_id', csrfProtection, async (req, res, next) => {
  try {
    if(!idRegex.test(req.params.collection_id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findById(req.params.collection_id)
    if(!clipCollection) {
      res.status(404).end()
    } else {
      clipCollection.name = req.body.name
      await clipCollection.save()
      const clips = await Clip.find().forCollection(req.params.collection_id)
      res.status(200).json({...clipCollection.inspect(), ...{clips: clips}})
    }
  } catch(err) {
    next(err)
  }
})

app.put('/api/collections/:collection_id/order', csrfProtection, async (req, res, next) => {
  try {
    if(!idRegex.test(req.params.collection_id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findById(req.params.collection_id)
    if(!clipCollection) {
      res.status(404).end()
    } else {
      const clips = await Clip.find().forCollection(req.params.collection_id)

      try {
        const updatedClips = await Promise.all(clips.map((clip) => {
          clip.position = req.body[clip._id]
          return clip.save()
        }))
        updatedClips.sort((l, r) => l.position - r.position)
        res.status(200).json({...clipCollection.inspect(), ...{clips: clips}})
      } catch (err) {
        next(err)
      }
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

app.delete('/api/collections/:collection_id/clips/:id', csrfProtection, async (req, res, next) => {
  try {
    if(!idRegex.test(req.params.collection_id) || !idRegex.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clip = await Clip.findOne({_id: req.params.id, clipCollection: req.params.collection_id})
    if(!clip) {
      res.status(404).end()
    } else {
      await Clip.deleteOne({_id: clip._id})
      res.status(200).end()
    }
  } catch(err) {
    next(err)
  }
})

app.get('/api/collections', csrfProtection, async (req, res, next) => {
  let user = null;
  
  if(!req.session['userId']) {
    res.status(403).end()
    return
  }

  user = User.findById(req.session['userId'])

  if(!user) {
    res.status(403).end()
    return
  }
  
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
    const associatedClips = await Promise.all(found.map(collection => Clip.find().forCollection(collection._id)))
    const foundWithClips = found.map((collection, i) => { return {...collection.inspect(), ...{clips: associatedClips[i]} } } )

    res.json({
      total: count,
      pages: pages,
      page: pageIndex + 1,
      results: foundWithClips
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
