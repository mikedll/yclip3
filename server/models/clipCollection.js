
const mongoose = require('mongoose')

const ClipSchema = new mongoose.Schema({
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
    required: true
  },
  clips: {
    type: [ClipSchema]
  }
  
})

const ClipCollection = mongoose.model('ClipCollection', ClipCollectionSchema)

module.exports = ClipCollection
