
const mongoose = require('mongoose')

const ThumbnailSchema = new mongoose.Schema({
  clipCollectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClipCollection',
    required: true
  },
  name: {
    type: String,
    required: false
  }
})

ThumbnailSchema.methods.path = function() {
  return '/storage/' + this.name
}

const Thumbnail = mongoose.model('Thumbnail', ThumbnailSchema)

module.exports = Thumbnail
