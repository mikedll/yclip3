const ClipCollection = require('./models/clipCollection.js')
const Clip = require('./models/clip.js')
const User = require('./models/user.js')

const appUtils = {

  // mongo Ids
  idRegex: /^[0-9a-fA-F]{24}$/,

  lookForUser: async function (req, res) {
    let user = null;
    
    if(!req.session['userId']) {
      return null
    }

    try {
      user = await User.findById(req.session['userId'])
    } catch(error) {
      console.error("Unable to do user search, error occurred: ", error)
      return null
    }
    
    if(!user) {
      return null
    }

    return user
  },

  requireUser: async function (req, res) {
    let user = null;
    
    if(!req.session['userId']) {
      res.status(403).end()
      return null
    }

    user = await User.findById(req.session['userId'])
    if(!user) {
      res.status(403).end()
      return null
    }

    return user
  },

  withPages: async function (req, res, next, mongoQuery) {
    try {
      const PageSize = 9
      
      let pageIndex = 0
      try {
        pageIndex = req.query.page ? (Number(req.query.page) - 1) : 0
      } catch(error) {
        pageIndex = 0
      }

      const count = await ClipCollection.countDocuments(mongoQuery)
      const pages = Math.floor(count / PageSize) + ((count % PageSize > 0) ? 1 : 0)
      
      const found = await ClipCollection.find(mongoQuery, null, { limit: PageSize, skip: pageIndex * PageSize })
      const associatedClips = await Promise.all(found.map(collection => Clip.find().forCollection(collection._id)))
      const foundWithClips = found.map((collection, i) => { return {...collection.inspect(), ...{clips: associatedClips[i]} } } )

      res.json({
        total: count,
        pages: pages,
        page: pageIndex + 1,
        results: foundWithClips
      })

    } catch (err) {
      next(err)
    }
  }

}

module.exports = appUtils
