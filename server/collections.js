const express = require('express')
const app = express.Router()

const ClipCollection = require('./models/clipCollection.js')
const Clip = require('./models/clip.js')
const appUtils = require('./appUtils.js')

app.get('/', async (req, res, next) => {
  appUtils.withPages(req, res, next, {isPublic: true})
})

app.get('/:id', async (req, res, next) => {
  const user = await appUtils.lookForUser(req, res)

  try {
    if(!appUtils.idRegex.test(req.params.id)) {
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

module.exports = app
