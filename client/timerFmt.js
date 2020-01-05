
export function formatTime(time) {
  const hours = Math.floor(time / (60 * 60))
  let remaining = time - (hours * 60 * 60)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining - (minutes * 60)
  const secondsRounded = +(Math.round(seconds + "e+3")  + "e-3")
  let ret = String(secondsRounded)

  if(ret.length < 2) {
    ret = '0' + ret
  }

  ret = minutes + ':' + ret

  if(hours > 0) {
    if(String(minutes).length < 2) {
      ret = '0' + ret
    }

    ret = hours + ':' + ret
  }

  return ret
}
