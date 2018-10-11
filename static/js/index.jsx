var ytApiLoadedHook = null;

function onYouTubeIframeAPIReady() {
  ytApiLoadedHook()
}

function dout(s) {
  console.log(s)
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
      clipIndex: null
    }

    this.onPlay = this.onPlay.bind(this)    
    this.onPlayerReady = this.onPlayerReady.bind(this)
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this)
  }

  curClip() {
    if(this.state.clipIndex === null) return null;

    if(this.state.clipIndex < this.state.clips.length) {
      return this.state.clips[this.state.clipIndex]
    }
    return null
  }

  /*
   * Keeps calling itself once called until the current clip
   * is done (pos is within epsilon of ending).
   */
  nextClipOrReschedule() {
    if(!this.state.loaded) {
      dout("error: trying to interrupt while not yet loaded.")
      return
    }

    if(this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
      // Let player state change schedule an interrupt.
      return
    }
    
    const c = this.curClip()
    if(!c) {
      dout("error: requested timeout without a clip in bounds.")
      return
    }

    const pos = this.player.getCurrentTime()
    dout("nextClip: pos=" + (Math.round(pos * 100) / 100))

    // Time left, so schedule interrupt (make a timeout)
    if (pos < c.end) {
      dout("setting time out for " + (Math.round((c.end - pos) * 100) / 100) + " c.end=" + c.end)
      // Have to start capturing the return values
      // to prevent users from causing infinite
      // timeouts by repetitively clicking the play clips button.
      setTimeout(() => {
        this.nextClipOrReschedule()
      }, (c.end - pos) * 1000)
    } else {
      dout("interrupt: detected end of clip. setState being called.")
      this.setState((state, props) => { return {clipIndex: state.clipIndex + 1} })
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    dout("didUpdate.start")

    const s = this.player.getPlayerState()
    const c = this.curClip()
    switch (s) {
    case YT.PlayerState.PAUSED:
    case YT.PlayerState.CUED:
    case YT.PlayerState.UNSTARTED: {
      dout("didUpdated.(unstarted,cued,paused)")
      if(this.state.clipIndex === 0) {
        dout("didUpdated.seeking")
        this.player.seekTo(c.start, true)
        this.player.playVideo()
      }
      break
    }
    case YT.PlayerState.PLAYING: {
      if (!c) {
        // All clips done
        this.player.pauseVideo()
      } else {
        // Next clip jump required?
        const pos = this.player.getCurrentTime()
        if(pos < c.start) {
          this.player.seekTo(c.start, true)
        }
      }
      break
    }
    default: {
      // buffering...stopped...?
      dout("didUpdated.default with state=" + s)
    }}
  }
  
  onPlay(e) {
    e.preventDefault()
    if (!this.state.loaded) {
      dout("error: trying to play when player isn't ready.")
      return
    }

    dout("onPlay.clipIndex=" + this.state.clipIndex)
    if(this.state.clipIndex === null || this.state.clipIndex >= this.state.clips.length) {
      dout("onPlay.calling setState")
      this.setState({clipIndex: 0})
    }    
  }

  onPlayerReady(e) {
    this.setState({loaded: true})
  }
  
  onPlayerStateChange(e) {
    dout("player.state.changed.")
    switch (e.data) {
    case YT.PlayerState.CUED: {
      dout("noticed cued")
      break
    }
    case YT.PlayerState.UNSTARTED: {
      dout("noticed unstarted.")
      break
    }
    case YT.PlayerState.PLAYING: {
      dout("detected player is playing.")
      // what if an interrupt is already scheduled?
      this.nextClipOrReschedule()
      break
    }
    default: {
      dout("noticed ? = " + e.data)
      // unstarted? cued?
    }}
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
    // dout("invoked render")
    let cMsg = "n/a"
    let btnMsg = "Loading..."
    if(this.state.loaded) {
      btnMsg = "Roll Clips"
      const c = this.curClip()
      if(c) {
        cMsg = `${this.state.clipIndex+1} of ${this.state.clips.length}`
      }
    }
    
    return (
      <div className="embedded-player-container">
        <div id="embedded-player-5"></div>
        <div className="controls">
          <div>Playing Clip: {cMsg}</div>
          <button disabled={!this.state.loaded} onClick={this.onPlay} className="btn btn-primary btn-lg btn-block">{btnMsg}</button>
        </div>
        
      </div>
    )
  }
}

const clips = [{
  start: 30,
  duration: 1.5
},{
  start: 500,
  duration: 3
}]

ReactDOM.render(<App clips={clips}/>, document.querySelector('.player-container'))
