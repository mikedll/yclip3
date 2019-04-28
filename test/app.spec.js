
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
  }, clip2 = {
    "vid":"dQw4w9WgXcQ",
    "start":43,
    "duration":3
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
        return request(app).post('/api/collections/' + collection._id + '/clips').send(clip1)
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

  it('should save many clips as needed', function() {
    const collection = new ClipCollection({name: "nice songs"})
    return collection.save()
      .then(collection => {
        return request(app).post('/api/collections/' + collection._id + '/clips').send(clip1)
      })
      .then((response) => {
        return request(app).post('/api/collections/' + collection._id + '/clips').send(clip2)
      })
      .then((response) => {
        return ClipCollection.findById(collection._id)
      })
      .then((collectionUpdated) => {
        expect(collectionUpdated.clips.length).to.equal(2)
        expect(collectionUpdated.clips[0].vid).to.equal("Iwuy4hHO3YQ")
        expect(collectionUpdated.clips[1].vid).to.equal("dQw4w9WgXcQ")
      })    
  })

  it('should return a collection', () => {
    const collection = new ClipCollection({name: "nice songs", clips: [clip1, clip2]})
    return collection.save()
      .then(collection => {
        return request(app).get('/api/collections/' + collection._id)
      })
      .then(response => {
        expect(response.status).to.equal(200)
        
        expect(response.body._id).to.equal(collection._id.toString())
        expect(response.body.clips.length).to.equal(2)
        expect(response.body.clips[0]._id).to.equal(collection.clips[0]._id.toString())
      })
    
  })

  it('should create a new collection', () => {
    return request(app).post('/api/collections')
      .then(response => {
        expect(response.status).to.equal(201)
        return ClipCollection.findById(response.body._id)
      })
      .then(collection =>{
        expect(collection).to.not.be.null
        expect(collection).to.not.be.undefined
      })
  })
})
