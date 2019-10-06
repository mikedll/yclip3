
import React from 'react';
import AjaxAssistant from 'AjaxAssistant.jsx'

class CollectionPlayer extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      player: null,      // did the YT player become defined and start loading?
      loaded: false,     // did the YT player load?
      clipIndex: null,
      seeking: false,
      retrieving: false, // are we fetching data from server?
      error: ""
    }
    
    this.onPlay = this.onPlay.bind(this)    
    this.onPlayerReady = this.onPlayerReady.bind(this)
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this)
  }

  curClip() {
    if(this.state.clipIndex === null) return null;

    if(this.state.clipIndex < this.state.collection.clips.length) {
      const clip = this.state.collection.clips[this.state.clipIndex]
      
      return {
        vid: clip.vid,
        start: clip.start,
        end: (clip.start + clip.duration)
      }
    }
    return null
  }

  calcClipInc(prevState) {
    if(!prevState.collection) {
      return {error: "Internal error in player."}
    }
    
    const next = {}
    if(prevState.clipIndex >= prevState.collection.clips.length - 1) {
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
    if(this.state.clipIndex === null || this.state.clipIndex >= this.state.collection.clips.length) {
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

  scheduleMountPlayer() {
    const mountPlayer = () => {
      if(this.state.collection.clips.length === 0) {
        // No clips to play :(
        return;
      }
      
      window.ytPlayer = this.player = new YT.Player('embedded-player-5', {
        height: '390',
        width: '640',
        videoId: this.state.collection.clips[0].vid,
        events: {
          'onReady': this.onPlayerReady,
          'onStateChange': this.onPlayerStateChange
        }
      })
    }
    
    if(window.ytApiLoaded) {
      mountPlayer()
    } else {
      window.ytApiLoadedHook = () => {
        mountPlayer()
      }
      window.ytApiLoadedHook = window.ytApiLoadedHook.bind(this)
    }    
  }

  tryRetrieveAndMountPlayer() {
    if(!this.player) {
      // Why not? Missing a collection? Or just missing the player?
      if(!this.state.collection && !this.state.retrieving) {
        this.setState({error: "", retrieving: true})
        new AjaxAssistant(this.props.$).get('/api/collections/' + this.props.match.params.id)
          .then((data) => {
            this.setState({collection: data})
          })
          .catch(error => {
            this.setState({error})
          })
        return
      } else if (this.state.collection){
        this.scheduleMountPlayer()
        return
      } else {
        // collection does not exist, but was retrieving. Future render will call this again
        // via componentDidUpdate.
        return
      }
    }    
  }
  
  componentDidMount() {
    this.tryRetrieveAndMountPlayer()
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {
    if(!this.player) {
      this.tryRetrieveAndMountPlayer()
      return
    }
    
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
      if(prevState.clipIndex === prevState.collection.clips.length && this.state.clipIndex === null) {
        // Clips finished.
        dout("successful finish")
        break
      }
    }
    case YT.PlayerState.CUED:
    case YT.PlayerState.UNSTARTED: {
      dout("didUpdate.(ended,cued,unstarted)")
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

  componentWillUnmount() {
    if(this.state.loaded) {
      this.player.destroy()
    }
  }

  canPlayClips() {
    return (this.state.collection && this.state.loaded && this.state.collection.clips.length > 0)
  }

  render() {
    // dout("invoked render")
    let btnMsg
    if(this.state.collection && this.state.collection.clips.length === 0) {
      btnMsg = "No Clips in Compilation"
    } else if (this.state.loaded) {
      btnMsg = "Roll Clips"
    } else {
      btnMsg = "Loading..."
    }

    const rows = !this.state.collection ? null : this.state.collection.clips.map((c, i) => (
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

    const errorMsg = (this.state.error === "") ? "" : (
      <div className="alert alert-danger">
        {this.state.error}
      </div>
    )
    
    return (
      <div className="embedded-player-container">
        {errorMsg}
        
        <div id="embedded-player-5"></div>

        <div className="clip-summary">
          <div>Clips in this Compilation:</div>
          {table}
        </div>
        <div className="controls">
          <button disabled={!this.canPlayClips()} onClick={this.onPlay} className="btn btn-primary btn-lg btn-block">{btnMsg}</button>
        </div>
        
      </div>
    )
  }
}

export default CollectionPlayer
