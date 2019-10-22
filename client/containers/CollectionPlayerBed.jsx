
import { connect } from 'react-redux'

import {
  nextClipOrMonitor,
  ClipCheckState,
  notSeeking,
  gotoNextClip,
  curClip,
  seekingToClip,
  fetchingCollection,
  fetchCollectionToPlay,
  shutdownPlayer,
  jumpToForPlay,
  ytLoaded
} from '../actions.js'

import underscore from 'underscore'

import CollectionPlayer from '../components/CollectionPlayer.jsx'

const mapStateToProps = state => {
  const clipCheckIsDue = (state.playing.clipCheck === ClipCheckState.DUE)
  const propCurClip = curClip(state.playing)
  return {...state.playing, clipCheckIsDue, curClip: propCurClip, fetching: state.collectionPlayRequested }
}

const mapDispatchToProps = (dispatch) => ({
  onVideoEnd: () => {
    dispatch(gotoNextClip())
  },
  enteredPlaying: () => {
    dispatch(notSeeking())
  },
  nextClipOrScheduleCheck: (vid, currentTime) => {
    dispatch(nextClipOrMonitor(vid, currentTime))
  },
  seeking: () => {
    dispatch(seekingToClip())
  },
  fetch: ($, id) => {
    dispatch(fetchCollectionToPlay($, id))
  },
  shutdown: () => {
    dispatch(shutdownPlayer())
  },
  jumpTo: (index) => {
    dispatch(jumpToForPlay(index))
  },
  ytLoaded: () => {
    dispatch(ytLoaded())
  }
})

const CollectionPlayerBed = connect(mapStateToProps, mapDispatchToProps)(CollectionPlayer)
export default CollectionPlayerBed
