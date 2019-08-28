const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  vendor: {
    type: String,
    required: true
  },
  vendorId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
})
const User = mongoose.model('User', UserSchema)

const ClipCollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: false
  },
  isPublic: {
    type: Boolean,
    required: true
  }
})

const ClipCollection = mongoose.model('ClipCollection', ClipCollectionSchema)

const config = require('../config.js')
const mongooseEvents = require('../mongooseEvents.js')

mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)

async function up() {  
  try {

    // Have to have this in place so that on login on production, we
    // can trade in a new VendorID from Google.
    
    let holderUser = process.env.YCLIP3_HOLD_USER
    if(!holderUser) {
      console.log("Define YCLIP3_HOLD_USER env variable for this migration.")
      return
    }
    
    let user = new User({
      vendor: 'Google',
      vendorId: '',
      email: holderUser,
      name:''
    })
    await user.save()
    
    let count = await ClipCollection.countDocuments({})
    console.log("Collections being changed: " + count)
    
    const clipCollections = await ClipCollection.find({})
    
    const saves = clipCollections.each(clipCollection => {
      clipCollection.userId = user._id
      clipCollection.isPublic = true
      return clipCollection.save()
    })
    await Promise.all(saves)

    console.log("Done.")
  } catch(err) {
      console.log("Error during migration: " + err)
  }
}

up().then(_ => {
  mongoose.disconnect()
})



