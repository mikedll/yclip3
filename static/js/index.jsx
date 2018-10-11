var ytApiLoadedHook = null
var ytPlayer

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
        vid: c.vid,
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
      // Video might have started buffering.
      // Could be something else.
      return
    }
    
    const c = this.curClip()
    if(!c) {
      dout("error: requested timeout without a clip in bounds.")
      return
    }

    if (this.player.getVideoData().video_id !== c.vid) {
      // wrong video. this timeout probably should have been
      // cleared.
      dout("critical error: video_id mismatch in nextClip. clear this timeout?")
      return
    }

    const pos = this.player.getCurrentTime()
    dout("nextClip: pos=" + (Math.round(pos * 100) / 100))
    if (pos < c.end) {
      // Time left, so schedule interrupt (make a timeout)
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

  componentWillUnmount() {
    if(this.loaded) {
      this.player.destroy()
    }
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {
    dout("didUpdate.start")

    const s = this.player.getPlayerState()
    const c = this.curClip()
    switch (s) {
    case YT.PlayerState.ENDED:
    case YT.PlayerState.PAUSED:
    case YT.PlayerState.CUED:
    case YT.PlayerState.UNSTARTED: {
      dout("didUpdated.(ended,paused,cued,unstarted)")
      if(this.state.clipIndex === 0) {
        dout("didUpdated.seeking")
        if(this.player.getVideoData().video_id !== c.vid) {
          this.player.cueVideoById({videoId:c.vid, startSeconds: c.start, endSeconds: c.end})
        } else {
          this.player.seekTo(c.start, true)
          this.player.playVideo()
        }
      }
      break
    }
    case YT.PlayerState.PLAYING: {
      if (!c) {
        // All clips done
        this.player.pauseVideo()
      } else {
        if(this.player.getVideoData().video_id !== c.vid) {
          this.player.cueVideoById({videoId:c.vid, startSeconds: c.start, endSeconds: c.end})
        } else {
          // Next clip jump required?
          const pos = this.player.getCurrentTime()
          if(pos < c.start) {
            this.player.seekTo(c.start, true)
          }
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
    switch (e.data) {
    case YT.PlayerState.ENDED: {
      // don't bother waiting for a scheduled nextClip. Jump clips.
      if (this.state.clipIndex !== 0 &&
          this.state.clipIndex < this.state.clips.length) {
        dout("unusual case: ended video and more clips.")
        this.setState((prevState, prevProps) => { return {clipIndex: prevState.clipIndex + 1} })
      }
      break
    }
    case YT.PlayerState.CUED: {
      dout("player.state.cued")
      // Handle nextClipJump to new video.
      const c = this.curClip()
      if(c) {
        if(this.player.getVideoData().video_id !== c.vid) {
          dout("very unexpected. cued video that isn't for current clip. shutting clips down.")
          this.setState({clipIndex: null})
        } else {
          dout("seeking to " + c.start)
          // this.player.seekTo(c.start, true)
          this.player.playVideo()
        }
      }
      break
    }
    case YT.PlayerState.BUFFERING: {
      dout("player.state.buffer")
      break
    }
    case YT.PlayerState.UNSTARTED: {
      dout("player.state.unstarted")
      break
    }
    case YT.PlayerState.PAUSED: {
      dout("player.state.paused")
      // clear scheduled nextClip?
      break
    }
    case YT.PlayerState.PLAYING: {
      dout("player.state.playing.")
      if(this.curClip()) {
        // what if an interrupt is already scheduled?
        this.nextClipOrReschedule()
      }
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

      
      if(this.state.clips.length === 0) {
        dOut("very strange. loaded without a clip.")
        return;
      }

      window.ytPlayer = this.player = new YT.Player('embedded-player-5', {
        height: '390',
        width: '640',
        videoId: this.state.clips[0].vid,
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
  vid: 'QLkSoyQDOXo',
  start: 30,
  duration: 1.5
},{
  vid: 'QLkSoyQDOXo',
  start: 500,
  duration: 2
},{
  vid: '4JrJBq_sYMY',
  start: 167,
  duration: 2
}]

ReactDOM.render(<App clips={clips}/>, document.querySelector('.player-container'))
