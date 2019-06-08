
const path = require('path')
const srcDir = path.join(__dirname, '../server/')
const Clip = require(path.join(srcDir, 'models/clip.js'))
const expect = require('chai').expect

describe('Clip', function() {

  it.only('should parse ending and beginning into start/duration', () => {
    const clip = new Clip()
    clip.parseStartEnd('1:32', '1:45')
    expect(clip.start).to.equal(92)
    expect(clip.duration).to.equal(13)

    clip.parseStartEnd('1:29:59', '1:30:45.331')
    expect(clip.start).to.equal(5399)
    expect(clip.duration).to.equal(46.331)
  })
})

