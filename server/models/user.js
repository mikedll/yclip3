
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

module.exports = User

