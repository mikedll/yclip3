
const request = require('supertest')
const expect = require('chai').expect
const path = require('path')
const srcDir = path.join(__dirname, '../server/')
const app = require(path.join(srcDir, 'app.js'))
const mongoose = require('mongoose')
const ClipCollection = require(path.join(srcDir, 'models/clipCollection.js'))
const config = require(path.join(srcDir, 'config.js'))
  
describe('App', () => {

  let clip1 = {
    vid:"Iwuy4hHO3YQ",
    start: 34,
    duration: 3
  }
  
  before(() => {
    return mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)
      .then(() => ClipCollection.deleteMany({}))
  })

  after(() => { return mongoose.disconnect() } )
  
  it('should save a new clip in a collection', function() {
    const collection = new ClipCollection({name: "nice songs"})
    return collection.save()
      .then(collection => {
        return request(app).post('/api/collections/' + collection._id + '/clips', clip1)
      })
      .then((response) => {
        expect(response.status).to.equal(201)
        return ClipCollection.findById(collection._id)
      })
      .then((collectionUpdated) => {
        expect(collectionUpdated.clips.length).to.equal(1)
        expect(collectionUpdated.clips[0].vid).to.equal("Iwuy4hHO3YQ")
      })
  })
})
