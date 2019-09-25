const fs = require('fs')
const path = require('path')
const os = require('os')

const express = require('express')
const cookieParser = require('cookie-parser')
const cons = require('consolidate')
const csrf = require('csurf')
const underscore = require('underscore')
const ClipCollection = require('./models/clipCollection.js')
const Clip = require('./models/clip.js')
const User = require('./models/user.js')
const Thumbnail = require('./models/thumbnail.js')
const config = require('./config.js')
const { OAuth2Client } = require('google-auth-library')
const cookieSession = require('cookie-session')
const fileupload = require('express-fileupload')

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

const csrfOpts = {cookie: true}
if(config.env === "test") {
  csrfOpts.ignoreMethods = ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE']
}

const csrfProtection = csrf(csrfOpts)

app.get(/^\/((?!api).)*$/, csrfProtection, async (req, res, next) => {
  let user = null;
  
  if(req.session['userId']) {
    user = await User.findById(req.session['userId'])
  }
  
  res.render('index', {
    csrfToken: req.csrfToken(),
    googleClientId: config.googleClientId,
    user: user ? JSON.stringify(user) : "null"
  })
})

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
      // Do we have the user on record with the given email?
      let user = await User.findOne({email: payload['email']})      
      if(!user) {
        // New user.
        user = new User({
          vendor: 'Google',
          vendorId: payload['sub'],
          name: payload['name'],
          email: payload['email']
        })
        await user.save()
      } else {
        // On record with the given email. Overwrite vendorId (sub).
        user.vendor = 'Google'
        user.vendorId = payload['sub']
        user.name = payload['name']
        await user.save()
      }
    }

    req.session['userId'] = user._id
    res.json(user)
  } catch(err) {
    console.error(err)
    next(err)
  }
})

app.get('/api/signout', async(req, res, next) => {
  req.session = null
  res.status(200).json(null)
})

async function lookForUser(req, res) {
  let user = null;
  
  if(!req.session['userId']) {
    return null
  }

  try {
    user = await User.findById(req.session['userId'])
  } catch(error) {
    console.error("Unable to do user search, error occurred: ", error)
    return null
  }
  
  if(!user) {
    return null
  }

  return user
}

app.get('/api/collections/:id', csrfProtection, async (req, res, next) => {
  const user = await lookForUser(req, res)

  try {
    if(!idRegex.test(req.params.id)) {
      res.status(404).end()
      return
    }

    let clipCollection = await ClipCollection.findOne({isPublic: true, _id: req.params.id})
    if(!clipCollection) {
      if(user) {
        clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.id})
      }

      if(!clipCollection) {
        res.status(404).end()
        return
      }
    } else {
      const clips = await Clip.find().forCollection(clipCollection._id)
      res.json({ ...clipCollection.inspect(), ...{clips: clips} })
    }
  } catch(err) {
    next(err)
  }
})

async function requireUser(req, res) {
  let user = null;
  
  if(!req.session['userId']) {
    res.status(403).end()
    return null
  }

  user = await User.findById(req.session['userId'])
  if(!user) {
    res.status(403).end()
    return null
  }

  return user
}

app.get('/api/me/collections/:id', csrfProtection, async (req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return
  
  try {
    if(!idRegex.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.id})
    if(!clipCollection) {
      res.status(404).end()
    } else {
      const clips = await Clip.find().forCollection(clipCollection._id)
      const thumbnail = await Thumbnail.findOne({clipCollection: clipCollection._id})
      res.json({ ...clipCollection.toJSON(), ...{clips: clips}, ...{thumbnail: thumbnail} })
    }
  } catch(err) {
    next(err)
  }
})

app.put('/api/me/collections/:id', csrfProtection, async (req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return

  try {
    if(!idRegex.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.id})
    if(!clipCollection) {
      res.status(404).end()
    } else {
      ['name', 'isPublic'].forEach((attr) => {
        if(underscore.has(req.body, attr)) clipCollection[attr] = req.body[attr]
      })
      await clipCollection.save()
      const clips = await Clip.find().forCollection(req.params.id)
      res.status(200).json({...clipCollection.inspect(), ...{clips: clips}})
    }
  } catch(err) {
    next(err)
  }
})

app.put('/api/me/collections/:collection_id/order', csrfProtection, async (req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return
  
  try {
    if(!idRegex.test(req.params.collection_id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.collection_id})
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

app.post('/api/me/collections/:collection_id/thumbnail', async(req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return

  if(!/^[0-9a-fA-F]{24}$/.test(req.params.collection_id)) {
    res.status(404).end()
    return
  }

  let clipCollection
  try {
    clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.collection_id})
    if(!clipCollection) {
      res.status(404).end()
      return
    }    
  } catch(e) {
    next(e)
    return
  }

  if(!req.files || !req.files.filepond) {
    res.status(422).end()
    return
  }

  let thumbnail = new Thumbnail({clipCollection: clipCollection._id, name: clipCollection._id.toString()})
  await thumbnail.save()
  
  let saveTo = thumbnail.path()
  try {
    await req.files.filepond.mv(saveTo)
  } catch(e) {
    next(e)
    return
  }

  res
    .status(200)
    .send(thumbnail.name)
    .end()
})

app.delete('/api/me/collections/:id', csrfProtection, async (req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return

  try {
    if(!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.id})
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

app.post('/api/me/collections/:collection_id/clips', csrfProtection, async (req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return

  try {
    if(!/^[0-9a-fA-F]{24}$/.test(req.params.collection_id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.collection_id})
    if(!clipCollection) {
      res.status(404).end()
    } else {
      let newClip = new Clip()
      newClip.clipCollection = clipCollection._id
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

app.delete('/api/me/collections/:collection_id/clips/:id', csrfProtection, async (req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return

  try {
    if(!idRegex.test(req.params.collection_id) || !idRegex.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.collection_id})
    const clip = await Clip.findOne({_id: req.params.id, clipCollection: clipCollection._id})
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

async function withPages(req, res, next, mongoQuery) {
  try {
    const PageSize = 9
    
    let pageIndex = 0
    try {
      pageIndex = req.query.page ? (Number(req.query.page) - 1) : 0
    } catch(error) {
      pageIndex = 0
    }

    const count = await ClipCollection.countDocuments(mongoQuery)
    const pages = Math.floor(count / PageSize) + ((count % PageSize > 0) ? 1 : 0)
    
    const found = await ClipCollection.find(mongoQuery, null, { limit: PageSize, skip: pageIndex * PageSize })
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
}

app.get('/api/me/collections', csrfProtection, async(req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return

  withPages(req, res, next, {userId: user._id})
})

app.get('/api/collections', csrfProtection, async (req, res, next) => {
  withPages(req, res, next, {isPublic: true})
})

app.post('/api/me/collections', csrfProtection, async (req, res, next) => {
  let user = await requireUser(req, res)
  if(!user) return
  
  const clipCollection = new ClipCollection({userId: user._id, name: ""})
  clipCollection.save()
    .then(collection => res.status(201).json(collection))
    .catch(err => { next(err) })
})


module.exports = app
