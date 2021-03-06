
const session = require('supertest-session');
const expect = require('chai').expect
const path = require('path')
const srcDir = path.join(__dirname, '../server/')
const app = require(path.join(srcDir, 'app.js'))
const mongoose = require('mongoose')
const User = require(path.join(srcDir, 'models/user.js'))
const ClipCollection = require(path.join(srcDir, 'models/clipCollection.js'))
const Clip = require(path.join(srcDir, 'models/clip.js'))
const Thumbnail = require(path.join(srcDir, 'models/thumbnail.js'))
const config = require(path.join(srcDir, 'config.js'))
const underscore = require('underscore')

app.post('/api/sessions/testsignin', (req, res, next) => {
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
  }, dogPicture = path.join(__dirname, './support/stockdog.jpg')

  before(() => {
    config.s3.bucket = config.s3.testBucket // Choosing here to do this.
    return mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)
  })

  beforeEach(() => {
    return ClipCollection.deleteMany({})
      .then(_ => Clip.deleteMany({}))
      .then(_ => Thumbnail.deleteMany({}))
      .then(_ => User.deleteMany({}))
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
        return wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
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
      let collection = new ClipCollection({userId: user1._id, name: "nice songs " + i, isPublic: true})
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

    const wrappedApp = session(app)
    await wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
      
    const response = await wrappedApp.put('/api/me/collections/' + collection._id).send({name: "nice poems"})
    expect(response.status).to.equal(200)
    const collectionFound = await ClipCollection.findOne({_id: collection._id})
    expect(collectionFound.name).to.equal('nice poems')
  })
  
  it('should save a new clip in a collection', function() {
    let wrappedApp = session(app)
    
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    return wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
      .then(_ => {
        return collection.save()
      })
      .then(collection => {
        const clip1b = {
          vid: clip1.vid,
          start: "34",
          end: "37"
        }

        return wrappedApp.post('/api/me/collections/' + collection._id + '/clips').send(clip1b)
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
    let wrappedApp = session(app)
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
    return wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
      .then(_ => {
        return collection.save()
      })
      .then(collection => {
        return wrappedApp.post('/api/me/collections/' + collection._id + '/clips').send(clip1b)
      })
      .then((response) => {
        expect(response.status).to.equal(201)
        return wrappedApp.post('/api/me/collections/' + collection._id + '/clips').send(clip2b)
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

  it('should return a public collection', () => {
    let savedClips = []
    const collection = new ClipCollection({userId: user1._id, isPublic: true, name: "nice songs"})
    return collection.save()
      .then(collection => {
        [clip1, clip2].forEach(async (clip) => {
          let newClip = Clip(clip)
          newClip.clipCollection = collection._id
          newClip = await newClip.save()
          savedClips.push(newClip)
        })

        return session(app).get('/api/collections/' + collection._id)
      })
      .then(response => {
        expect(response.status).to.equal(200)

        expect(response.body._id).to.equal(collection._id.toString())
        expect(response.body.clips.length).to.equal(2)

        expect(response.body.clips.map(c => c._id)).to.have.members(savedClips.map(sc => sc._id.toString()))
      })
  })

  it('should return an owned collection', () => {
    let wrappedApp = session(app)

    let savedClips = []
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    return collection.save()
      .then(collection => {
        [clip1, clip2].forEach(async (clip) => {
          let newClip = Clip(clip)
          newClip.clipCollection = collection._id
          newClip = await newClip.save()
          savedClips.push(newClip)
        })

        return wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
      })
      .then(_ => {
        return wrappedApp.get('/api/me/collections/' + collection._id)
      })
      .then(response => {
        expect(response.status).to.equal(200)
        
        expect(response.body._id).to.equal(collection._id.toString())
        expect(response.body.clips.length).to.equal(2)
        expect(response.body.clips.map(c => c._id)).to.have.members(savedClips.map(sc => sc._id.toString()))
      })
  })
  
  it('should create a new collection', () => {
    let wrappedApp = session(app)
    
    return wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
      .then(_ => {
        return wrappedApp.post('/api/me/collections')
      })
      .then(response => {
        expect(response.status).to.equal(201)
        expect(response.body.userId).to.equal(user1._id.toString())
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

    const clipsReady = [clip1, clip2].map(c => {
      let newClip = new Clip(c)
      newClip.clipCollection = collection._id
      return newClip
    })

    let saved = []
    saved.push(await clipsReady[0].save())
    saved.push(await clipsReady[1].save())
    
    const ordering = {
      [saved[0]._id]: 1,
      [saved[1]._id]: 0
    }

    const wrappedApp = session(app)
    await wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
    
    const response = await wrappedApp.put('/api/me/collections/' + collection._id + '/order').send(ordering)
    expect(response.status).to.equal(200)

    const foundClips = await Clip.find({clipCollection: collection._id}).sort('position')
    expect(foundClips[0].vid).to.equal("dQw4w9WgXcQ")
    expect(foundClips[1].vid).to.equal("Iwuy4hHO3YQ")
  })

  it('should give position to any new clip added', async () => {
    const collection = new ClipCollection({userId: user1._id, name: "my list"})
    await collection.save()

    const wrappedApp = session(app)
    await wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
    
    const clipsCasted = [clip1, clip2].map((clip) => {
      let clipCasted = clip
      clipCasted.end = (clipCasted.start + clipCasted.duration).toString()
      clipCasted.start = clipCasted.start.toString()
      return clipCasted
    })

    await wrappedApp.post('/api/me/collections/' + collection._id + '/clips').send(clipsCasted[0])
    await wrappedApp.post('/api/me/collections/' + collection._id + '/clips').send(clipsCasted[1])
    
    const clips = await Clip.find({clipCollection: collection._id}).sort('position')
    
    const foundClips = await Clip.find({clipCollection: collection._id}).sort('position')
    expect(foundClips[0].position).to.equal(0)
    expect(foundClips[1].position).to.equal(1)
  })

  it('should permit clip deletion', async () => {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    await collection.save()

    const savedClips = await Promise.all([clip1, clip2].map(async (clip) => {
      let newClip = new Clip(clip)
      newClip.clipCollection = collection._id
      return await newClip.save()
    }))
        
    const wrappedApp = session(app)
    await wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
    
    const response = await wrappedApp.delete('/api/me/collections/' + collection._id + '/clips/' + savedClips[0]._id)
    expect(response.status).to.equal(200)

    const foundClips = await Clip.find({clipCollection: collection._id})
    expect(foundClips).to.have.lengthOf(1)
    expect(foundClips[0].vid).to.equal("dQw4w9WgXcQ")
  })

  it('should permit thumbnail upload', async () => {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    await collection.save()

    const wrappedApp = session(app)
    await wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
    
    const response = await wrappedApp.post('/api/me/collections/' + collection._id + '/thumbnail')
          .attach('filepond', dogPicture)

    expect(response.status).to.equal(200)

    // body is returning as an empty object {}, 9/24/19
    expect(response.res.text).to.match(/[A-Za-z0-9]+/)

    let thumbnail = await Thumbnail.findOne({name: response.res.text})
    expect(thumbnail).to.not.be.null

    // cleanup of storage.
    let err = await thumbnail.destroyStoredFile(config.s3.bucket !== undefined)
    expect(err).to.be.null
  })

  it('should include thumbnail when returning a collection from api', async () => {
    const collection = new ClipCollection({userId: user1._id, name: "nice songs"})
    await collection.save()

    const thumbnail = new Thumbnail({clipCollection: collection._id, name: 'asdf0'})
    await thumbnail.save()

    const wrappedApp = session(app)
    await wrappedApp.post('/api/sessions/testsignin').send({userId: user1._id})
    
    const response = await wrappedApp.get('/api/me/collections/' + collection._id)

    expect(response.body.thumbnail._id).to.equal(thumbnail._id.toString())
  })
  
  it('should permit logout', () => {
    let appSession = session(app)
    
    return appSession.post('/api/sessions/testsignin').send({userId: user1._id})
      .then(_ => {
        return appSession.get('/api/me/collections')
      })
      .then(response => {
        expect(response.status).to.equal(200)
        return appSession.get('/api/sessions/signout')
      })
      .then(response => {
        expect(response.status).to.equal(200)
        return appSession.post('/api/me/collections')
      })
      .then(response => {
        expect(response.status).to.equal(403)
      })
  })
  
  
})
