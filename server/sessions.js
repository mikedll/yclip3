const express = require('express')
const app = express.Router()

const User = require('./models/user.js')
const config = require('./config.js')
const { OAuth2Client } = require('google-auth-library')

app.post('/signin', async (req, res, next) => {
  const client = new OAuth2Client(config.googleClientId)
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: config.googleClientId
    })

    const payload = ticket.getPayload()

    let user = await User.findOne({vendor: 'Google', vendorId: payload['sub']})
    if(!user) {
      // Do we have the user on record with the given email?
      let user = await User.findOne({email: payload['email']})      
      if(!user) {
        // New user.
        user = new User({
          vendor: 'Google',
          vendorId: payload['sub'],
          name: payload['name'],
          email: payload['email']
        })
        await user.save()
      } else {
        // On record with the given email. Overwrite vendorId (sub).
        user.vendor = 'Google'
        user.vendorId = payload['sub']
        user.name = payload['name']
        await user.save()
      }
    }

    req.session['userId'] = user._id
    res.json(user)
  } catch(err) {
    console.error(err)
    next(err)
  }
})

app.get('/signout', async(req, res, next) => {
  req.session = null
  res.status(200).json(null)
})

module.exports = app
