
const mongoose = require('mongoose')

const ClipSchema = new mongoose.Schema({
  clipCollection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClipCollection',
    required: true
  },
  vid: {
    type: String,
    required: true
  },
  start: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
})

ClipSchema.methods.parseStartEnd = function(sStart, sEnd) {
  const round3 = (input) => {
    return +(Math.round(input + "e+3")  + "e-3")    
  }
  const toSeconds = (input) => {
    let secondsSlot = -1, minutesSlot = -1, hoursSlot = -1, seconds = 0

    let intRegex = /^[0-9]{1,2}$/
    let floatRegex = /^[0-9]{1,2}(\.([0-9]{1,3})?)?$/
    
    let slots = input.split(':')
    if(slots.length === 3 && intRegex.test(slots[0]) && intRegex.test(slots[1]) && floatRegex.test(slots[2])) {
      hoursSlot = 0
      minutesSlot = 1
      secondsSlot = 2
    } else if (slots.length === 2 && intRegex.test(slots[0]) && floatRegex.test(slots[1])) {
      minutesSlot = 0
      secondsSlot = 1
    } else if (slots.length === 1 && floatRegex.test(slots[0])) {
      secondsSlot = 0
    } else {
      secondsSlot = -1
      // Invalid input - too many slots.
      throw "Invalid input."
    }

    if(hoursSlot !== -1) seconds += parseInt(slots[hoursSlot]) * 60 * 60
    if(minutesSlot !== -1) seconds += parseInt(slots[minutesSlot]) * 60
    if(secondsSlot !== -1) seconds += parseFloat(slots[secondsSlot])

    // https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
    return seconds
  }
  
  this.start = round3(toSeconds(sStart))
  this.duration = round3(toSeconds(sEnd) - this.start)
}

const Clip = mongoose.model('Clip', ClipSchema)

module.exports = Clip
