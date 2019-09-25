const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const config = require('../config.js')

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
  return path.join(config.localStorageLocation, this.name + '.png')
}

ThumbnailSchema.methods.destroyStoredFile = function() {
  return new Promise((resolve, reject) => {
    fs.unlink(this.path(), (err) => {
      if(err) {
        reject(err)
      } else {
        resolve()
      }
    })    
  })  
}

const Thumbnail = mongoose.model('Thumbnail', ThumbnailSchema)

module.exports = Thumbnail
