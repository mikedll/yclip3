
const http = require('http')
const fs = require('fs')
const path = require('path')

const Mustache = require('mustache')
const _ = require('lodash')
const appRoot = __dirname;
const staticDir = path.join(appRoot, 'static')

const DefaultPort = 8081 // sharing this with windows Go...

function e500(res) {
  res.writeHead(505, {'Content-Type': 'text/html'})
  res.write("There was an internal server error.")
  res.end()  
}

function e404(res) {
  res.writeHead(404, {'Content-Type': 'text/plain'})
  res.write("Resource not found.")
  res.end()
}
function fromTemplate(req, res, view, templBindings) {
}

/*
 * id is sanitized.
 */
function clip(req, res, id) {
  fs.readFile(path.join(appRoot, 'data', id + '.json'), {encoding: 'UTF-8'}, (err, content) => {
    if (err !== null) {
      e404(res)
      console.log(req.url + " (404)")
      return
    }

    const clips = JSON.parse(content)
    fs.readFile(path.join(appRoot, 'views', "clip.mustache"), {encoding: 'UTF-8'}, (err, content) => {
      if (err !== null) {
        e500(res)
        console.log(req.url + " (500)")
        return
      }

      res.writeHead(200, {'Content-Type': 'text/html'})
      res.write(Mustache.render(content, {bootstrap: JSON.stringify(clips)}))
      res.end()    
      console.log(req.url)
    })
    
  })
}

function handleDynamicPath(req, res, dPath) {

  const idRegex = /^[a-zA-Z0-9]+$/

  const stub1 = function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.write("One day this can be interesting.")
    res.end()
    console.log(req.url)
  }
  
  const rootHandle = function(req, res) {
    clip(req, res, "1")
  }

  /*
   * These are not specific enough.
   */
  const matches = [
    ['/me/clips/', clip, true],
    ['/me/clips', stub1, false],
    ['/', rootHandle, false]
  ]

  if (!  _.some(matches, (matchRoute, i) => {

    if(!matchRoute[2] && dPath === matchRoute[0]) {
      matchRoute[1].call(this, req, res)
      return true
    } else if(matchRoute[2] && dPath.indexOf(matchRoute[0]) !== -1) {
      // attempt id match?
      const possibleId = dPath.substr(matchRoute[0].length, dPath.length - matchRoute[0].length)
      const regexRes = idRegex.exec(possibleId)
      if(regexRes) {
        matchRoute[1].call(this, req, res, regexRes[0])
        return true
      }
    }

    return false
  })) {
    e404(res)
    console.log(dPath + " (404)")    
  }
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
function staticServe(req, res, reqPath, reqPathNoAlias) {
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
          handleDynamicPath(req, res, reqPathNoAlias)
        } else {
          handleDynamicPath(req, res, reqPath)
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
function handleReq(req, res) {

  // some/dir/path/ -> some/dir/path
  // some/file/path.html (same)
  // /foo/// -> /foo
  // /// -> /
  // / (same)
  let chomped = req.url;
  while (chomped.length > 1 && chomped[chomped.length - 1] === '/') {
    chomped = chomped.slice(0, chomped.length-1)
  }
  
  const basename = path.extname(chomped)
  if (basename === '' || (basename[0] !== '.' && path.extname(chomped) === '')) {
    // "/" -> "/index.html"
    // some/dir/path -> some/dir/path/index.html
    staticServe(req, res, path.join(chomped, 'index.html'), chomped)
  } else {
    // /css/.unusual
    // /css/app.css
    // /index.html
    staticServe(req, res, chomped)
  }
}

function main() {
  console.log("Creating server and listening.")
  http.createServer(function(req, res) {
    handleReq(req, res)
  }).listen(DefaultPort)

  console.log("server queued to listen on " + DefaultPort)
}

main()
