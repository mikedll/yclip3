
const session = require('supertest-session');
const expect = require('chai').expect
const path = require('path')
const srcDir = path.join(__dirname, '../server/')
const app = require(path.join(srcDir, 'app.js'))
const mongoose = require('mongoose')
const User = require(path.join(srcDir, 'models/user.js'))
const ClipCollection = require(path.join(srcDir, 'models/clipCollection.js'))
const Clip = require(path.join(srcDir, 'models/clip.js'))
const config = require(path.join(srcDir, 'config.js'))
const underscore = require('underscore')

app.post('/api/testsignin', (req, res, next) => {
  req.session['userId'] = req.body.userId
  res.status(200).end()
})

describe('App', () => {

  let user1attrs = {
    vendor: 'Unknown',
    vendorId: 'asdf1234',
    email: 'mike@example.com',
    name: "Mike Rivers",
  }, user1 = null, clip1 = {
    vid:"Iwuy4hHO3YQ",
    start: 34,
    duration: 3
  }, clip2 = {
    vid:"dQw4w9WgXcQ",
    start: 43,
    duration: 6
  }
  
  before(() => {
    return mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)
  })

  beforeEach(() => {
    return ClipCollection.deleteMany({})
      .then(_ => {
        user1 = new User(user1attrs)
        return user1.save()
      })
  })

  after(() => { return mongoose.disconnect() } )

  it('should require login to see owned collections', () => {
    const saves = underscore.times(19, (i) => {
      let collection = new ClipCollection({userId: user1._id, name: "nice song choruses " + i})
      return collection.save()
    })
    return Promise.all(saves)
      .then(_ => {
        return session(app).get('/api/me/collections?page=2')
      })
      .then(response => {
        expect(response.status).to.equal(403)
      })
  })

  
  it('should list owned compilations with page support', () => {
    let wrappedApp = session(app)
    
    const saves = underscore.times(19, (i) => {
      let collection = new ClipCollection({userId: user1._id, name: "nice song choruses " + i})
      return collection.save()
    })
    return Promise.all(saves)
      .then(collections => {
        return wrappedApp.post('/api/testsignin').send({userId: user1._id})
      })
      .then(response => {
        return wrappedApp.get('/api/me/collections?page=2')
      })
      .then(response => {
        expect(response.status).to.equal(200)
        expect(response.body.total).to.equal(19)
        expect(response.body.pages).to.equal(3)
        expect(response.body.page).to.equal(2)
        expect(response.body.results[0].name).to.include("nice song choruses")
        expect(response.body.results.length).to.equal(9)
      })
  })

  it('should list public compilations without requiring login', () => {
    const saves = underscore.times(19, (i) => {
      let collection = new ClipCollection({userId: user1._id, name: "nice song choruses " + i})
      if(i % 5 === 0) collection.isPublic = true
      return collection.save()
    })
    return Promise.all(saves)
      .then(_ => {
        return session(app).get('/api/collections')
      })
      .then(response => {
        expect(response.status).to.equal(200)
        expect(response.body.results.length).to.equal(4)
      })
  })

  it('should calculate even number of pages correctly', () => {
    const saves = underscore.times(18, (i) => {
      let collection = new ClipCollection({userId: user1._id, name: "nice songs " + i})
      return collection.save()
    })
    return Promise.all(saves)
      .then(saved => {
        return session(app).get('/api/collections?page=2')
      })
      .then(response => {
        expect(response.body.pages).to.equal(2)
      })
  })

  it('should permit name editing', async () => {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    await collection.save()

    const response = await session(app).put('/api/collections/' + collection._id).send({name: "nice poems"})
    expect(response.status).to.equal(200)
    const collectionFound = await ClipCollection.findOne({_id: collection._id})
    expect(collectionFound.name).to.equal('nice poems')
  })
  
  it('should save a new clip in a collection', function() {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    return collection.save()
      .then(collection => {
        const clip1b = {
          vid: clip1.vid,
          start: "34",
          end: "37"
        }
        return session(app).post('/api/collections/' + collection._id + '/clips').send(clip1b)
      })
      .then((response) => {
        expect(response.status).to.equal(201)
        return Clip.find({clipCollection: collection._id})
      })
      .then((clips) => {
        expect(clips.length).to.equal(1)
        expect(clips[0].vid).to.equal("Iwuy4hHO3YQ")
      })
  })

  it('should save many clips as needed', function() {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    const clip1b = {
      vid: clip1.vid,
      start: "34",
      end: "37"
    }
    const clip2b = {
      vid: clip2.vid,
      start: "43",
      end: "49"
    }
    return collection.save()
      .then(collection => {
        return session(app).post('/api/collections/' + collection._id + '/clips').send(clip1b)
      })
      .then((response) => {
        return session(app).post('/api/collections/' + collection._id + '/clips').send(clip2b)
      })
      .then((response) => {
        return Clip.find({clipCollection: collection._id}).sort('createdAt')
      })
      .then((clips) => {
        expect(clips.length).to.equal(2)
        expect(clips[0].vid).to.equal("Iwuy4hHO3YQ")
        expect(clips[1].vid).to.equal("dQw4w9WgXcQ")
      })    
  })

  it('should return a collection', () => {
    let savedClips = []
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    return collection.save()
      .then(collection => {
        [clip1, clip2].forEach(async (clip) => {
          const newClip = Clip(clip)
          newClip.clipCollection = collection._id
          await newClip.save()
          savedClips.push(newClip)
        })

        return session(app).get('/api/collections/' + collection._id)
      })
      .then(response => {
        expect(response.status).to.equal(200)
        
        expect(response.body._id).to.equal(collection._id.toString())
        expect(response.body.clips.length).to.equal(2)
        expect(response.body.clips[0]._id).to.equal(savedClips[0]._id.toString())
      })
    
  })

  it('should create a new collection', () => {
    return session(app).post('/api/collections')
      .then(response => {
        expect(response.status).to.equal(201)
        return ClipCollection.findById(response.body._id)
      })
      .then(collection =>{
        expect(collection).to.not.be.null
        expect(collection).to.not.be.undefined
      })
  })

  it('should permit reordering', async () => {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    await collection.save()

    const savedClips = await Promise.all([clip1, clip2].map(async (clip) => {
      let newClip = new Clip(clip)
      newClip.clipCollection = collection._id
      return await newClip.save()
    }))
    
    const ordering = {
      [savedClips[0]._id]: 1,
      [savedClips[1]._id]: 0
    }
    
    const response = await session(app).put('/api/collections/' + collection._id + '/order').send(ordering)
    expect(response.status).to.equal(200)

    const foundClips = await Clip.find({clipCollection: collection._id}).sort('position')
    expect(foundClips[0].vid).to.equal("dQw4w9WgXcQ")
    expect(foundClips[1].vid).to.equal("Iwuy4hHO3YQ")
  })

  it('should permit clip deletion', async () => {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    await collection.save()

    const savedClips = await Promise.all([clip1, clip2].map(async (clip) => {
      let newClip = new Clip(clip)
      newClip.clipCollection = collection._id
      return await newClip.save()
    }))
        
    const response = await session(app).delete('/api/collections/' + collection._id + '/clips/' + savedClips[0]._id)
    expect(response.status).to.equal(200)

    const foundClips = await Clip.find({clipCollection: collection._id})
    expect(foundClips).to.have.lengthOf(1)
    expect(foundClips[0].vid).to.equal("dQw4w9WgXcQ")
  })

})
