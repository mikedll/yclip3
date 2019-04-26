
const path = require('path')
const srcDir = path.join(__dirname, '../server/')
const app = require(path.join(srcDir, 'app.js'))
const mongoose = require('mongoose')
const ClipCollection = require(path.join(srcDir, 'models/collection.js'))
  
describe('App', () => {

  beforeAll(() => {
    mongoose.connect(config.mongo.uri, config.mongo.collectionOpts)
  })
  
  test('it should save a new clip in a collection', () => {
    const collection = new ClipCollection({name: "nice songs"})
    return collection.save()
      .then(collection => {
        app.post('/collections/' + collection._id + '/clips')
      })
      .then(() => {
        const collectionUpdated = loadCollection(collection.id)
        expect(collectionUpdated.clips.length).toBe(1)
      })
  })
})
