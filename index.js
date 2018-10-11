
const http = require('http')
const fs = require('fs')
const path = require('path')
const Mustache = require('mustache')
const appRoot = __dirname;
const staticDir = path.join(appRoot, 'static')

const DefaultPort = 8081 // sharing this with windows Go...

function e500(res) {
  res.writeHead(505, {'Content-Type': 'text/html'})
  res.write("There was an internal server error.")
  res.end()  
}

function fromTemplate(view, res, templBindings) {
  fs.open(path.join(appRoot, 'views', view + ".mustache"), 'r', (err, fd) => {
    if (err) {
      if (err.code === 'ENOENT') {
        e500(res)
        return
      }

      throw err
    }

    let templateBody = ""
    res.writeHead(200, {'Content-Type': 'text/html'})
    fs.createReadStream('', {encoding: 'UTF-8', fd: fd})
      .on('data', (data) => {
        templateBody += data
      })
      .on('end', () => {
        res.write(Mustache.render(templateBody, templBindings))
        res.end()
      })
  })
  
}

function index(res) {
  // const clips = [{
  //   vid: 'Iwuy4hHO3YQ',
  //   start: 34,
  //   duration: 18
  // },{
  //   vid: 'dQw4w9WgXcQ',
  //   start: 43,
  //   duration: 8
  // },{
  //   vid: 'djV11Xbc914',
  //   start: 52,
  //   duration: 24
  // }]
  
  const clips = [{
    vid: 'Iwuy4hHO3YQ',
    start: 34,
    duration: 3
  },{
    vid: 'dQw4w9WgXcQ',
    start: 43,
    duration: 3
  },{
    vid: 'djV11Xbc914',
    start: 52,
    duration: 3
  }]

  fromTemplate('index', res, {bootstrap: JSON.stringify(clips)})
}

function handleDynamicPath(dPath, res) {
  switch (dPath) {
  case "/": {
    index(res)
    break
  }
  case "/me/clips": {
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.write("One day this can be interesting.")
    res.end()
    console.log(dPath)
    break
  }
  default: {
    res.writeHead(404, {'Content-Type': 'text/plain'})
    res.write("Resource not found.")
    res.end()
    console.log(dPath + " (404)")
  }}
}

/*
 * Client may pass reqPathNoAlias to indicate that
 * an alias was being tried, and thus a non-aliased
 * path should be sent to the dynamic handler.
 *
 * This should probably be changed to take an array
 * of aliases, and then use tail recursion to
 * try each of them.
 */
function staticServe(reqPath, res, reqPathNoAlias) {
  const MIMETypes = {
    'html': 'text/html',
    'js': 'text/javascript',
    'css': 'text/css',
    'png': 'image/png',
    'jpg': 'image/jpeg'
  }

  const staticFile = path.join(staticDir, reqPath)
  fs.open(staticFile, 'r', (err, fd) => {
    if (err) {
      if (err.code === 'ENOENT') {
        if(typeof(reqPathNoAlias) !== 'undefined') {
          handleDynamicPath(reqPathNoAlias, res)
        } else {
          handleDynamicPath(reqPath, res)
        }
        
        return;
      }

      throw err;
    }

    const ext = path.extname(staticFile)
    let contentType
    if (ext === '' || !(ext.slice(1) in MIMETypes)) {
      contentType = ''
    } else {
      contentType = MIMETypes[ext.slice(1)]
    }
    res.writeHead(200, {'Content-Type': contentType})
    fs.createReadStream('', {encoding: 'UTF-8', fd: fd})
      .on('data', (data) => {
        res.write(data)
      })
      .on('end', () => {
        res.end()
        console.log(reqPath)
      })
  })
}

/*
 * Simplifies path and tries aliases, if applicable to the path.
 */
function handleReq(reqPath, res) {

  // some/dir/path/ -> some/dir/path
  // some/file/path.html (same)
  // /foo/// -> /foo
  // /// -> /
  // / (same)
  let chomped = reqPath;
  while (chomped.length > 1 && chomped[chomped.length - 1] === '/') {
    chomped = chomped.slice(0, chomped.length-1)
  }
  
  const basename = path.extname(chomped)
  if (basename === '' || (basename[0] !== '.' && path.extname(chomped) === '')) {
    // "/" -> "/index.html"
    // some/dir/path -> some/dir/path/index.html
    staticServe(path.join(chomped, 'index.html'), res, chomped)
  } else {
    // /css/.unusual
    // /css/app.css
    // /index.html
    staticServe(chomped, res)
  }
}

function main() {
  console.log("Creating server and listening.")
  http.createServer(function(req, res) {
    handleReq(req.url, res)
  }).listen(DefaultPort)

  console.log("server queued to listen on " + DefaultPort)
}

main()
