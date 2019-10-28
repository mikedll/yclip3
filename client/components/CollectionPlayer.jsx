
import PropTypes from 'prop-types'
import React from 'react';
import AjaxAssistant from 'AjaxAssistant.jsx'

class CollectionPlayer extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      loaded: false,     // did the YT player become ready?
    }

    this.player = null
    
    this.onPlay = this.onPlay.bind(this)    
    this.onPlayerReady = this.onPlayerReady.bind(this)
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this)
  }

  onPlay(e) {
    e.preventDefault()
    if (!this.state.loaded) {
      dout("error: trying to play when player isn't ready.")
      return
    }

    dout("onPlay.clipIndex=" + this.props.clipIndex)
    if(this.props.clipIndex === null || this.props.clipIndex >= this.props.collection.clips.length) {
      dout("onPlay.calling setState")
      this.props.jumpTo(0)
    }
  }

  onPlayerReady(e) {
    this.setState({loaded: true})
  }
  
  onPlayerStateChange(e) {
    switch (e.data) {
    case YT.PlayerState.ENDED: {
      dout("player.state.ended")
      if (this.props.curClip && !this.props.seeking) {
        // nextClip() will be a noop. This is an opportunity to jump clips.
        this.props.onVideoEnd()
      } else {
        dout("clips finished cleanly.")
      }
      break
    }
    case YT.PlayerState.CUED: {
      dout("player.state.cued")
      // Handle nextClipJump to new video.
      const c = this.props.curClip
      if(c) {
        if(this.player.getVideoData().video_id !== c.vid) {
          dout("very unexpected. cued video that isn't for current clip. shutting clips down.")
          this.props.shutdown()
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
      if(this.props.curClip) {
        // todo: what if an interrupt is already scheduled?
        this.props.enteredPlaying()
        this.props.nextClipOrScheduleCheck(this.player.getVideoData().video_id,
                                           this.player.getCurrentTime())
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
      if(this.props.collection.clips.length === 0) {
        // No clips to play :(
        return;
      }

      window.ytPlayer = this.player = new YT.Player('embedded-player-5', {
        height: '390',
        width: '640',
        videoId: this.props.collection.clips[0].vid,
        events: {
          'onReady': this.onPlayerReady,
          'onStateChange': this.onPlayerStateChange
        }
      })

    }
    
    if(window.ytApiLoaded) {
      mountPlayer()
    } else if (!window.ytApiLoadedHook) {
      window.ytApiLoadedHook = () => {
        mountPlayer()
      }
      window.ytApiLoadedHook = window.ytApiLoadedHook.bind(this)
    }
  }

  fetchCollectionRequired() {
    return (!this.props.collection ||
            (this.props.collection._id !== this.props.match.params.id))
  }
  
  componentDidMount() {
    if(this.fetchCollectionRequired() && !this.props.busy) {
      this.props.fetch(this.props.$, this.props.match.params.id)
      return
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(this.fetchCollectionRequired() && !this.props.busy) {
      this.props.fetch(this.props.$, this.props.match.params.id)
      return
    }
    
    if(!this.player) {
      this.scheduleMountPlayer()
      return
    }

    if(this.props.clipCheckIsDue) {
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
      
      this.props.nextClipOrScheduleCheck(this.player.getVideoData().video_id,
                                         this.player.getCurrentTime())
      return
    }

    const seekIfNew = function(prevProps, curProps) {
      const c = curProps.curClip
      if (c && prevProps.clipIndex !== curProps.clipIndex) {
        // clip change
        if (this.player.getVideoData().video_id !== c.vid) {
          dout(`indexChange -> cueing(${c.vid})`)
          this.props.seeking()
          this.player.cueVideoById({videoId:c.vid, startSeconds: c.start, endSeconds: c.end})
        } else {
          this.player.seekTo(c.start, true)
        }
      }
    }

    if(!this.state.loaded) {
      return
    }
    const s = this.player.getPlayerState()
    switch (s) {
    case YT.PlayerState.ENDED: {
      if(prevProps.clipIndex === prevProps.collection.clips.length && this.props.clipIndex === null) {
        // Clips finished.
        dout("successful finish")
        break
      }
    }
    case YT.PlayerState.CUED:
    case YT.PlayerState.UNSTARTED: {
      dout("didUpdate.(ended,cued,unstarted)")
      seekIfNew.call(this, prevState, this.props)
      break
    }
    case YT.PlayerState.PLAYING: {
      dout("didUpdate.playing")
      if(prevProps.clipIndex !== null && this.props.clipIndex === null) {
        // Clips finished.
        this.player.pauseVideo()
      } else {
        seekIfNew.call(this, prevProps, this.props)
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
    if(!window.ytApiLoaded && window.ytApiLoadedHook) {
      window.ytApiLoadedHook = function(){}
    }
    
    if(this.state.loaded) {
      this.player.destroy()
    }
  }

  canPlayClips() {
    return (this.props.collection && this.props.collection.clips.length > 0 && this.state.loaded)
  }

  render() {
    // dout("invoked render")
    let btnMsg
    if(this.props.collection && this.props.collection.clips.length === 0) {
      btnMsg = "No Clips in Compilation"
    } else if (this.state.loaded) {
      btnMsg = "Roll Clips"
    } else {
      btnMsg = "Loading..."
    }

    const rows = !this.props.collection ? null : this.props.collection.clips.map((c, i) => (
      <tr key={i} className={"" + ((this.props.clipIndex !== null && this.props.clipIndex === i) ? 'active' : '')}>
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

    const errorMsg = (this.props.error === "") ? "" : (
      <div className="alert alert-danger">
        {this.props.error}
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

CollectionPlayer.propTypes = {
  $: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
  seeking: PropTypes.bool.isRequired,
  collection: PropTypes.object,
  clipIndex: PropTypes.number,
  clipCheck: PropTypes.string,
  curClip: PropTypes.object,
  busy: PropTypes.bool.isRequired,
  clipCheckIsDue: PropTypes.bool.isRequired,
  onVideoEnd: PropTypes.func.isRequired,
  enteredPlaying: PropTypes.func.isRequired,
  nextClipOrScheduleCheck: PropTypes.func.isRequired,
  seeking: PropTypes.func.isRequired,
  fetch: PropTypes.func.isRequired,
  shutdown: PropTypes.func.isRequired,
  jumpTo: PropTypes.func.isRequired
}

export default CollectionPlayer
