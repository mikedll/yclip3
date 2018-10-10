
const http = require('http')
const fs = require('fs')
const path = require('path')

const root = __dirname;

const DefaultPort = 8081 // sharing this with windows Go...

function staticServe(staticPath, resolve) {
  fs.open(path.join(root, staticPath), 'r', (err, fd) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error("Couldn't find starting page.")
        return;
      }

      throw err;
    }

    var contents = ""
    fs.createReadStream('', {encoding: 'UTF-8', fd: fd})
      .on('data', (data) => {
        contents += data
      })
      .on('end', () => {
        resolve(contents)
      })
  })
}

function main() {
  const indexH = 'static/index.html'
  
  console.log("Creating server and listening.")
  http.createServer(function(req, res) {
    switch (req.url) {
      case "/":
        staticServe(indexH, (contents) => {
          res.writeHead(200, {'Content-Type': 'text/html'})
          res.write(contents)
          res.end()
        })
        break;
      default:
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.write("not found.")
        res.end()
    }
  }).listen(DefaultPort)

  console.log("server queued to listen on " + DefaultPort)
}

main()
