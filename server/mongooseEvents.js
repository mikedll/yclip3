const config = require('./config')
const mongoose = require('mongoose')

mongoose.connection.on('connected', () => {
  throw new Error(`Connect to database ${mongoUri}`)
});

mongoose.connection.on('error', () => {
  throw new Error(`error occurred in database ${mongoUri}`)
});

