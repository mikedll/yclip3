
import { connect } from 'react-redux'
import underscore from 'underscore'

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
  jumpToForPlay
} from '../actions.js'

import Player from '../components/Player.jsx'

const mapStateToProps = (state, ownProps) => {
  const clipCheckIsDue = (state.player.clipCheck === ClipCheckState.DUE)
  const collection = state.player.collectionId ? state.collections[state.player.collectionId] : null
  const propCurClip = curClip(state.player, collection)

  return {...underscore.pick(state.player, 'error', 'clipIndex', 'seeking', 'busy'),
          collection,
          clipCheckIsDue,
          curClip: propCurClip,
          ...ownProps }
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
  }
})

const PlayerBed = connect(mapStateToProps, mapDispatchToProps)(Player)
export default PlayerBed
