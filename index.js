
function migrate(args) {
  const fs = require('fs')
  const path = require('path')
  
  if(args.length < 2) {
    console.error("migration arg required.")
    return
  }
  
  const version = args[1]

  const migrationsDir = path.join(__dirname, 'server/migrations')
  fs.readdir(migrationsDir, (err, files) => {
    if(err) {
      console.error("Error reading migrations directory: " + err)
      return
    }
    
    const matching = files.filter(file => file.startsWith(version + '_'))
    if(matching.length > 1) {
      console.error("Unexpected: more than one matching migration.")
      return
    }

    if(matching.length === 0) {
      console.error("Unable to find migration: " + version)
      return
    }

    console.log("Migrating with " + matching[0])

    require(path.join(migrationsDir, matching[0]))
  })
}

const args = process.argv.slice(2)

if(args.length > 0) {
  if(args[0] == 'migrate') {
    migrate(args)    
  }
} else {
  const app = require('./server/app.js')
  const config = require('./server/config.js')
  const mongooseEvents = require('./server/mongooseEvents.js')
  const mongoose = require('mongoose')
  mongoose.connect(config.mongo.uri, config.mongo.connectionOpts)
  app.listen(config.port, () => console.log(`Listening on port ${config.port}!`))
}

