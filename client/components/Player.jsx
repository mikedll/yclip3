
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import React from 'react';

import { formatTime } from 'timerFmt.js'
import AjaxAssistant from 'AjaxAssistant.jsx'
import { NotFound } from '../messages.js'

class Player extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      loaded: false,     // did the YT player become ready?
    }

    this.player = null
    
    this.onPlay = this.onPlay.bind(this)    
    this.onPlayerReady = this.onPlayerReady.bind(this)
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this)
    this.onJump = this.onJump.bind(this)    
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

  onJump(e, c) {
    e.preventDefault()
    if(!this.props.collection) return
    this.props.jumpTo(this.props.collection.clips.indexOf(c))
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
      if(this.player || !this.props.collection || this.props.collection.clips.length === 0) {
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

  /*
    Returns true if correct collection is present, and it
    is okay to proceed to render the player.
  */
  fetchCollectionIfNeeded() {
    if(this.fetchCollectionRequired()) {
      if(this.props.busy) return false

      if(this.props.error && this.props.error === NotFound)
        return false

      this.props.fetch(this.props.$, this.props.match.params.id)
      return false
    }

    return true
  }
  
  componentDidMount() {
    if(!this.fetchCollectionIfNeeded()) return

    if(!this.props.user && !this.props.collection.isPublic) {
      this.props.discardPrivateCollections()
      // Allow fetch to return Forbidden. Return.
      return
    }

    if(!this.player) {
      this.scheduleMountPlayer()
      return
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(!this.fetchCollectionIfNeeded()) {
      if(!prevProps.user && this.props.user) {
        this.props.resetError()
      }
      return
    }

    if(!this.props.user && !this.props.collection.isPublic) {
      this.player.destroy()
      window.ytPlayer = this.player = null
      this.setState({loaded: false})
      this.props.discardPrivateCollections()

      // Allow fetch to return NotFound.
      
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

    const seekIfNew = function(ytState, prevProps, curProps) {
      const c = curProps.curClip
      if (c && prevProps.clipIndex !== curProps.clipIndex) {
        // clip change
        if (ytState === YT.PlayerState.PAUSED || this.player.getVideoData().video_id !== c.vid) {
          dout(`indexChange -> cueing(${c.vid})`)
          this.props.seeking()
          this.player.cueVideoById({videoId:c.vid, startSeconds: c.start, endSeconds: c.end})
        } else {
          this.player.seekTo(c.start, true)
        }
      } else if (c && ytState === YT.PlayerState.PAUSED) {
        this.props.seeking()
        this.player.cueVideoById({videoId:c.vid, startSeconds: c.start, endSeconds: c.end})
      }
    }

    if(!this.state.loaded) {
      return
    }
    const s = this.player.getPlayerState()
    switch (s) {
    case YT.PlayerState.PAUSED: {
      if (this.props.curClip) {
        seekIfNew.call(this, s, prevProps, this.props)
      }
      break
    }
    case YT.PlayerState.ENDED: {
      if(prevProps.clipIndex === prevProps.collection.clips.length && this.props.clipIndex === null) {
        // Clips finished.
        dout("successful finish")
      } else if (this.props.curClip) {
        seekIfNew.call(this, s, prevProps, this.props)
      }
      break
    }
    case YT.PlayerState.CUED:
    case YT.PlayerState.UNSTARTED: {
      dout("didUpdate.(ended,cued,unstarted)")
      seekIfNew.call(this, s, prevProps, this.props)
      break
    }
    case YT.PlayerState.PLAYING: {
      dout("didUpdate.playing")
      if(prevProps.clipIndex !== null && this.props.clipIndex === null) {
        // Clips finished.
        this.player.pauseVideo()
      } else {
        seekIfNew.call(this, s, prevProps, this.props)
      }

      break
    }
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
        <td>
          <img src={`https://img.youtube.com/vi/${c.vid}/1.jpg`} />
          {c.vid}{' '}
          <a href='#' className='jump-link' onClick={e => this.onJump(e, c)}>[Jump Here]</a>
        </td>
        <td>{formatTime(c.start)}</td>
        <td>{formatTime(c.start + c.duration)}</td>
      </tr>      
    ))
    const table = (
        <table className="table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
    )

    const errorMsg = (this.props.error === "") ? null : (
      <div className="alert alert-danger">
        {this.props.error}
      </div>
    )

    const editLink = (this.props.user &&
                      this.props.collection &&
                      this.props.user._id === this.props.collection.userId)
          ? (<div className="text-center">
              <Link to={'/me/collections/' + this.props.collection._id + '/edit'}>Edit</Link>
             </div>
            )
          : null
    
    return (
      <div className="embedded-player-container">
        <div>{/* outside divs avoid react error: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node. */}
          {errorMsg}
        </div>

        {editLink}
        
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

Player.propTypes = {
  $: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
  seeking: PropTypes.bool.isRequired,
  user: PropTypes.object, 
  collection: PropTypes.object,
  clipIndex: PropTypes.number,
  curClip: PropTypes.object,
  busy: PropTypes.bool.isRequired,
  clipCheckIsDue: PropTypes.bool.isRequired,
  onVideoEnd: PropTypes.func.isRequired,
  enteredPlaying: PropTypes.func.isRequired,
  nextClipOrScheduleCheck: PropTypes.func.isRequired,
  seeking: PropTypes.func.isRequired,
  fetch: PropTypes.func.isRequired,
  shutdown: PropTypes.func.isRequired,
  jumpTo: PropTypes.func.isRequired,
  discardPrivateCollections: PropTypes.func.isRequired,
  resetError: PropTypes.func.isRequired
}

export default Player
