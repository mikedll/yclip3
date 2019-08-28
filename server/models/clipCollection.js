
const mongoose = require('mongoose')

const ClipCollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: false
  },
  isPublic: {
    type: Boolean,
    required: true,
    default: false
  }
})

const ClipCollection = mongoose.model('ClipCollection', ClipCollectionSchema)

module.exports = ClipCollection
