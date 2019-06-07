const mongoose = require('mongoose')

const ClipSchema = new mongoose.Schema({
  clipCollection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClipCollection',
    required: true
  },
  vid: {
    type: String,
    required: true
  },
  start: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
})

const Clip = mongoose.model('Clip', ClipSchema)

const OldClipSchema = new mongoose.Schema({
  vid: {
    type: String,
    required: true
  },
  start: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  }
})

const ClipCollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  clips: {
    type: [OldClipSchema]
  }
})

const ClipCollection = mongoose.model('ClipCollection', ClipCollectionSchema)

const config = require('../config.js')
const mongooseEvents = require('../mongooseEvents.js')

mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)

async function up() {  
  try {
    let count = await Clip.countDocuments({})
    console.log("Clip Count: " + count)
    
    const clipCollections = await ClipCollection.find({})
    
    const nestedSaves = clipCollections.map(clipCollection => {
      const saves = clipCollection.clips.map(clip => {
        const newClip = new Clip()
        newClip.clipCollection = clipCollection._id
        newClip.duration = clip.duration
        newClip.start = clip.start
        newClip.vid = clip.vid
        return newClip.save()        
      })      
     return saves
    })
      
    await Promise.all([].concat(...nestedSaves))

    // Clear old clips property from db.
    const schemaUpdates = clipCollections.map(clipCollection => {
      clipCollection.clips = undefined
      return clipCollection.save()
    })
    await Promise.all(schemaUpdates)

    count = await Clip.countDocuments({})
    console.log("Clip Count after: " + count)
  } catch(err) {
      console.log("Error during migration: " + err)
  }
}

up().then(_ => {
  mongoose.disconnect()
})



