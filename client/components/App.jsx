
import React from 'react';
import CollectionForm from './CollectionForm.jsx'

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
      clipIndex: null,
      seeking: false
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

  calcClipInc(prevState) {
    const next = {}
    if(prevState.clipIndex >= prevState.clips.length - 1) {
      next.clipIndex = null
    } else {
      next.clipIndex = prevState.clipIndex + 1
    }
    console.log("set clipIndex=" + next.clipIndex + ", was " + prevState.clipIndex)
    return next
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
      dout("nextClip() succeeded on clip " + this.state.clipIndex)
      this.setState((prevState) => (this.calcClipInc(prevState)))
    }
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
      dout("player.state.ended")
      if (this.state.clipIndex !== null && !this.state.seeking) {
        // nextClip() will be a noop. This is an opportunity to jump clips.
        this.setState((prevState) => (this.calcClipInc(prevState)))
      } else {
        dout("clips finished cleanly.")
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
        // todo: what if an interrupt is already scheduled?
        this.setState({seeking: false})
        this.nextClipOrReschedule()
      }
      break
    }
    default: {
      dout("noticed ? = " + e.data)
      // unstarted? cued?
    }}
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {

    const seekIfNew = function(prevState, curState) {
      if (prevState.clipIndex !== curState.clipIndex) {
        // clip change
        const c = this.curClip()
        if (this.player.getVideoData().video_id !== c.vid) {
          dout(`indexChange -> cueing(${c.vid})`)
          this.setState({seeking: true})
          this.player.cueVideoById({videoId:c.vid, startSeconds: c.start, endSeconds: c.end})
        } else {
          this.player.seekTo(c.start, true)
        }
      }
    }
    
    const s = this.player.getPlayerState()
    switch (s) {
    case YT.PlayerState.ENDED: {
      if(prevState.clipIndex === prevState.clips.length && this.state.clipIndex === null) {
        // Clips finished.
        dout("successful finish")
        break
      }
    }
    case YT.PlayerState.CUED:
    case YT.PlayerState.UNSTARTED: {
      dout("didUpdated.(ended,cued,unstarted)")
      seekIfNew.call(this, prevState, this.state)
      break
    }
    case YT.PlayerState.PLAYING: {
      dout("didUpdate.playing")
      if(prevState.clipIndex !== null && this.state.clipIndex === null) {
        // Clips finished.
        this.player.pauseVideo()
      } else {
        seekIfNew.call(this, prevState, this.state)
      }

      break
    }
    case YT.PlayerState.PAUSED:
    default: {
      // buffering...stopped...?
      dout("didUpdated.(ended,paused,other:" + s + ")")
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

  componentWillUnmount() {
    if(this.state.loaded) {
      this.player.destroy()
    }
  }


  render() {
    // dout("invoked render")
    let btnMsg = (this.state.loaded ? "Roll Clips" : "Loading...")

    const rows = this.props.clips.map((c, i) => (
      <tr key={i} className={"" + ((this.state.clipIndex !== null && this.state.clipIndex === i) ? 'active' : '')}>
        <td>{c.vid}</td>
        <td>{c.start}s</td>
        <td>{c.duration}s</td>
      </tr>      
    ))
    const table = (
        <table className="table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Start</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
    )
    
    return (
      <div className="embedded-player-container">
        <CollectionForm/>
        <div id="embedded-player-5"></div>

        <div className="clip-summary">
          <div>Clips in this Compilation:</div>
          {table}
        </div>
        <div className="controls">
          <button disabled={!this.state.loaded} onClick={this.onPlay} className="btn btn-primary btn-lg btn-block">{btnMsg}</button>
        </div>
        
      </div>
    )
  }
}

export default App
