
const express = require('express')
const app = express.Router()

const ClipCollection = require('./models/clipCollection.js')
const Clip = require('./models/clip.js')
const User = require('./models/user.js')
const Thumbnail = require('./models/thumbnail.js')

const underscore = require('underscore')
const csrfProtection = require('./csrfProtection.js')

const appUtils = require('./appUtils')

app.get('/', async(req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return

  appUtils.withPages(req, res, next, {userId: user._id})
})

app.get('/:id', csrfProtection, async (req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return
  
  try {
    if(!appUtils.idRegex.test(req.params.id)) {
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

app.post('/', csrfProtection, async (req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return
  
  const clipCollection = new ClipCollection({userId: user._id, name: ""})
  clipCollection.save()
    .then(collection => res.status(201).json(collection))
    .catch(err => { next(err) })
})

app.put('/:id', csrfProtection, async (req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return

  try {
    if(!appUtils.idRegex.test(req.params.id)) {
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

app.put('/:id/order', csrfProtection, async (req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return
  
  try {
    if(!appUtils.idRegex.test(req.params.id)) {
      res.status(404).end()
      return
    }

    const clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.id})
    if(!clipCollection) {
      res.status(404).end()
    } else {
      const clips = await Clip.find().forCollection(req.params.id)

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

app.post('/:id/thumbnail', async(req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return

  if(!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    res.status(404).end()
    return
  }

  let clipCollection
  try {
    clipCollection = await ClipCollection.findOne({userId: user._id, _id: req.params.id})
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

app.delete('/:id', csrfProtection, async (req, res, next) => {
  let user = await appUtils.requireUser(req, res)
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

app.post('/:collection_id/clips', csrfProtection, async (req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return

  try {
    if(!appUtils.idRegex.test(req.params.collection_id)) {
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

app.delete('/:collection_id/clips/:id', csrfProtection, async (req, res, next) => {
  let user = await appUtils.requireUser(req, res)
  if(!user) return

  try {
    if(!appUtils.idRegex.test(req.params.collection_id) || !appUtils.idRegex.test(req.params.id)) {
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

module.exports = app
