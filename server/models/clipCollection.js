
const mongoose = require('mongoose')

const ClipCollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  }
})

const ClipCollection = mongoose.model('ClipCollection', ClipCollectionSchema)

module.exports = ClipCollection
