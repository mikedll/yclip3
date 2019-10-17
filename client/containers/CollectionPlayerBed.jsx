
import { connect } from 'react-redux'

import {
  nextClipOrMonitor,
  ClipCheckState
} from '../actions.js'

import underscore from 'underscore'

import CollectionPlayer from '../components/CollectionPlayer.jsx'

const mapStateToProps = state => {
  const clipCheckIsDue = (state.playing.clipCheck === ClipCheckState.DUE)
  return {...state.playing, clipCheckIsDue}
}

const mapDispatchToProps = (dispatch) => ({
  nextClipOrScheduleCheck: (vid, currentTime) => {
    dispatch(nextClipOrMonitor(vid, currentTime))
  }
})

const CollectionPlayerBed = connect(mapStateToProps, mapDispatchToProps)(CollectionPlayer)
export default CollectionPlayerBed
