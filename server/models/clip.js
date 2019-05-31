
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
  }
})

const Clip = mongoose.model('Clip', ClipSchema)

module.exports = Clip
