
const path = require('path')
const fs = require('fs')

const AWS = require('aws-sdk')
const gm = require('gm')
const imageMagick = gm.subClass({imageMagick: true})

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

ThumbnailSchema.methods.moveToStorage = async function(remoteS3, filepond) {

  const processedPath = filepond.tempFilePath + '-processed.png'
  let processPromise = new Promise((resolve, reject) => {
    imageMagick(filepond.tempFilePath)
      .resize(275, 150)
      .write(processedPath, (err) => {
        if(err) reject(err)
        else resolve()
      })
  })

  try {
    await processPromise
  } catch(e) {
    return e
  }
  
  let caughtError = null
  if(remoteS3) {
    AWS.config.update({accessKeyId: config.s3.key, secretAccessKey: config.s3.secret})

    let readDataPromise = new Promise((resolve, reject) => {
      fs.readFile(processedPath, (err, data) => {
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
    let renamePromise = new Promise((resolve, reject) => {
      fs.rename(processedPath, this.diskPath(), (err) => {
        if(err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
    try {
      await renamePromise
    } catch(err) {
      caughtError = err
    }
  }

  return caughtError
}
ThumbnailSchema.methods.destroyStoredFile = async function(remoteS3) {
  let caughtError = null
  
  if(remoteS3) {
    AWS.config.update({accessKeyId: config.s3.key, secretAccessKey: config.s3.secret})

    let s3lib = new AWS.S3()
    let deletePromise = new Promise((resolve, reject) => {
      s3lib.deleteObject({
        Bucket: config.s3.bucket,
        Key: this.relativePath(),
      }, (err, data) => {
        if(err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
    try {
      const response = await deletePromise
    } catch(e) {
      caughtError = e
    }
    
  } else {
    let deletePromise = new Promise((resolve, reject) => {
      fs.unlink(this.diskPath(), (err) => {
        if(err) {
          reject(err)
        } else {
          resolve()
        }
      })    
    })

    try {
      await deletePromise
    } catch(e) {
      caughtError = e
    }
  }

  return caughtError
}

const Thumbnail = mongoose.model('Thumbnail', ThumbnailSchema)

module.exports = Thumbnail
