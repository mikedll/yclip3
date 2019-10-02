
const path = require('path')
const fs = require('fs')

const AWS = require('aws-sdk')

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

ThumbnailSchema.methods.diskPath = function() {
  return path.join(config.localStorageLocation, this.relativePath())
}

ThumbnailSchema.methods.relativePath = function() {
  return this.name + '.png'
}

ThumbnailSchema.methods.moveToStorage = async function(filepond) {
  let caughtError = null
  
  if(config.s3.bucket) {
    AWS.config.update({accessKeyId: config.s3.key, secretAccessKey: config.s3.secret})

    let readDataPromise = new Promise((resolve, reject) => {
      fs.readFile(filepond.tempFilePath, (err, data) => {
        if(err) reject(err)
        else resolve(data)
      })
    })

    let dataTemp
    try {
      dataTemp = await readDataPromise
    } catch(e) {
      caughtError = e
    }

    let s3lib = new AWS.S3()
    let uploadPromise = new Promise((resolve, reject) => {
      s3lib.putObject({
        ACL: 'public-read',
        Bucket: config.s3.bucket,
        Key: this.relativePath(),
        'ContentType': 'image/png',
        'ContentLength': dataTemp.byteLength,
        Body: dataTemp
      }, (err, data) => {
        if(err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
    try {
      const data = await uploadPromise
    } catch(e) {
      caughtError = e
    }
  } else {
    let saveTo = this.diskPath()
    filepond.mv(saveTo)
  }

  return caughtError
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
