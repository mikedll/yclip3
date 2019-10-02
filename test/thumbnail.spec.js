
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const srcDir = path.join(__dirname, '../server/')
const User = require(path.join(srcDir, 'models/user.js'))
const ClipCollection = require(path.join(srcDir, 'models/clipCollection.js'))
const Thumbnail = require(path.join(srcDir, 'models/thumbnail.js'))
const expect = require('chai').expect
const config = require(path.join(srcDir, 'config.js'))

describe('Thumbnail', function() {
  
  let user1attrs = {
    vendor: 'Unknown',
    vendorId: 'asdf1234',
    email: 'mike@example.com',
    name: "Mike Rivers"
  }

  before(() => {
    return mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)
  })

  after(() => { return mongoose.disconnect() } )

  it('should destroy local disk file on destroyStoredFile', (done) => {
    let user, clipCollection, thumbnail

    user = new User(user1attrs)
    user.save()
      .then(_ => {
        clipCollection = new ClipCollection({userId: user._id})
        return clipCollection.save()
      })
      .then(_ => {
        thumbnail = new Thumbnail({clipCollection: clipCollection._id, name: clipCollection._id})
        return thumbnail.save()
      })
      .then(_ => {
        const targetFile = thumbnail.diskPath()

        fs.copyFile(path.join(__dirname, 'support/stockdog.jpg'), targetFile, (err) => {
          if(err) { console.error('failed to copy support file') }

          thumbnail.destroyStoredFile(false)
            .then(_ => {
              fs.access(targetFile, fs.constants.F_OK, (err) => {
                expect(err.code).to.equal('ENOENT')
                const thumbnailId = thumbnail._id.toString()
                Thumbnail.deleteOne({_id: thumbnail._id})
                  .then(_ => {
                    return Thumbnail.findOne({_id: thumbnailId})
                  })
                  .then(lost => {
                    expect(lost).to.be.null
                    done()
                  })
              })
            })          
        })

      })
  })
})

