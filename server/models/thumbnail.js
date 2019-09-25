
const mongoose = require('mongoose')

const ThumbnailSchema = new mongoose.Schema({
  clipCollection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClipCollection',
    required: true
  },
  name: {
    type: String,
    required: false
  }
})

ThumbnailSchema.query.forCollection = function(id) {
  return this.find({clipCollection: id})
}

ThumbnailSchema.methods.path = function() {
  return '/storage/' + this.name
}

const Thumbnail = mongoose.model('Thumbnail', ThumbnailSchema)

module.exports = Thumbnail
