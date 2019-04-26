
const app = require('./server/app.js')
const config = require('./server/config.js')
const mongooseEvents = require('./server/mongooseEvents.js')
const mongoose = require('mongoose')
mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)

app.listen(config.port, () => console.log(`Listening on port ${config.port}!`))
