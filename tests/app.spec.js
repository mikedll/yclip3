
const request = require('supertest')
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
  
  beforeAll(() => { return mongoose.connect(config.mongo.uri, config.mongo.connectionOpts) })

  afterAll(() => { return mongoose.disconnect() } )
  
  test('it should save a new clip in a collection', () => {
    const collection = new ClipCollection({name: "nice songs"})
    return collection.save()
      .then(collection => {
        request(app).post('/collections/' + collection._id + '/clips', clip1)
      })
      .then((response) => {
        const collectionUpdated = loadCollection(collection.id)
        expect(collectionUpdated.clips.length).toBe(1)
        expect(collectionUpdated.clips[0].vid).toBe("Iwuy4hHO3YQ")
      })
  })
})
