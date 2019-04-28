
const request = require('supertest')
const expect = require('chai').expect
const path = require('path')
const srcDir = path.join(__dirname, '../server/')
const app = require(path.join(srcDir, 'app.js'))
const mongoose = require('mongoose')
const ClipCollection = require(path.join(srcDir, 'models/clipCollection.js'))
const config = require(path.join(srcDir, 'config.js'))
const _ = require('underscore')

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
  })

  beforeEach(() => {
    return ClipCollection.deleteMany({})
  })

  after(() => { return mongoose.disconnect() } )

  it.only('should list compilations with page support', () => {
    const saves = _.times(19, (i) => {
      let collection = new ClipCollection({name: "nice songs " + i, clips: [clip1, clip2]})
      return collection.save()
    })
    return Promise.all(saves)
      .then(saved => {
        return request(app).get('/api/collections?page=2')
      })
      .then(response => {
        expect(response.body.total).to.equal(19)
        expect(response.body.pages).to.equal(3)
        expect(response.body.page).to.equal(2)
        expect(response.body.results[0].name).to.equal("nice songs 9")
        expect(response.body.results.length).to.equal(9)
      })
  })

  it.only('should calculate even number of pages correctly', () => {
    const saves = _.times(18, (i) => {
      let collection = new ClipCollection({name: "nice songs " + i, clips: [clip1, clip2]})
      return collection.save()
    })
    return Promise.all(saves)
      .then(saved => {
        return request(app).get('/api/collections?page=2')
      })
      .then(response => {
        expect(response.body.pages).to.equal(2)
      })
  })
  
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
