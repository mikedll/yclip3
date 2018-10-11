
var ytApiLoadedHook = null;

function onYouTubeIframeAPIReady() {
  ytApiLoadedHook()
}

class App extends React.Component {

  constructor(props) {
    super(props)

    const clips = this.props.clips.map((c) => {
      return {
        start: c.start,
        end: c.start + c.duration
      }
    })
    
    this.state = {
      player: null,
      loaded: false,
      clips: clips,
      clipIndex: 0
    }

    this.onPlay = this.onPlay.bind(this)    
    this.onPlayerReady = this.onPlayerReady.bind(this)
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this)
  }

  curClip() {
    if(this.state.clipIndex < this.state.clips.length) {
      return this.state.clips[this.state.clipIndex]
    }
    return null
  }

  /*
   * Keeps calling itself once called until the current clip
   * is done (pos is within epsilon of ending).
   */
  endClipOrScheduleInterrupt() {
    if(!this.state.loaded) {
      console.log("error: trying to interrupt while not yet loaded.")
      return
    }
    
    const c = this.curClip()
    if(!c) {
      console.log("error: requested timeout without a clip in bounds.")
      return
    }

    const pos = this.player.getCurrentTime()
    console.log("interrupt: current time from player: " + pos)

    // Time left, so schedule interrupt (make a timeout)
    if (pos < c.end) {
      console.log("setting time out for " + (c.end - pos) + " c.end=" + c.end + " pos=" + pos)
      // Have to start capturing the return values
      // to prevent users from causing infinite
      // timeouts by repetitively clicking the play clips button.
      setTimeout(() => {
        this.endClipOrScheduleInterrupt()
      }, (c.end - pos) * 1000)
    } else {
      console.log("interrupt: detected end of clip. setState being called.")
      this.setState((state, props) => {
        return {clipIndex: state.clipIndex + 1}
      })
    }
  }

  componentDidUpdate() {
    const c = this.curClip()
    if(this.player.getPlayerState() === YT.PlayerState.PLAYING
       && !(this.state.clipIndex < this.state.clips.length)) {
      this.player.pauseVideo()
    }
  }
  
  onPlay(e) {
    e.preventDefault()
    if (!this.state.loaded) return

    // find current clip
    // if video is inside current clip (>=, <), take difference till end of clip
    //   else, move video to start of current clip, and play it.
    // set timeout for pausing video at that point.
    // if clips are done, leave video paused. move clipIndex to 0.
    // timeout func should jump video to next point.
    // upon play resumption, repeat (find clip, schedule stop).
    
    const c = this.curClip()
    this.player.seekTo(c.start, true)
    this.player.playVideo()
    this.endClipOrScheduleInterrupt()
  }

  onPlayerReady(e) {
    this.setState({loaded: true})
  }
  
  onPlayerStateChange(e) {
    // if(e.data === YT.PlayerState.PAUSED) {
    // }
  }
  
  componentDidMount() {
    // bind to ytApiLoadedHook before onYouTubeIframeAPIReady tries
    // to use it.
    window.ytApiLoadedHook = () => {
      this.player = new YT.Player('embedded-player-5', {
        height: '390',
        width: '640',
        videoId: 'QLkSoyQDOXo',
        events: {
          'onReady': this.onPlayerReady,
          'onStateChange': this.onPlayerStateChange
        }
      })      
    }

    let tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)    
  }

  render() {
    let cMsg = "n/a"
    let remMsg = "n/a"
    const c = this.curClip()
    if(this.state.loaded && c) {
      const pos = this.player.getCurrentTime()
      if(pos >= c.start && pos < c.end) {
        remMsg = "{Math.round((end - pos) * 100) / 2} seconds"
      }
    }
    
    return (
      <div className="embedded-player-container">
        <div id="embedded-player-5"></div>
        <div className="controls">
          <div>Playing Clip: {cMsg}</div>
          <div>Time Left: {remMsg}</div>
          <button onClick={this.onPlay} className="btn btn-primary btn-lg btn-block">Roll Clips</button>
        </div>
        
      </div>
    )
  }
}

const clips = [{
  start: 30,
  duration: 3
},{
  start: 500,
  duration: 3
}]

ReactDOM.render(<App clips={clips}/>, document.querySelector('.player-container'))
