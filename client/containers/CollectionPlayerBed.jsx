
import { connect } from 'react-redux'

import { calcNextClipOrReschedule } from '../actions.js'
import underscore from 'underscore'

import CollectionPlayer from '../components/CollectionPlayer.jsx'

const mapStateToProps = state => ({
  ...state.playing,
  collection: state.collections
})

const mapDispatchToProps = (dispatch) => ({
  nextClipOrReschedule: () => {
    dispatch(calcNextClipOrReschedule())
  }
})

const CollectionPlayerBed = connect(mapStateToProps, mapDispatchToProps)(CollectionPlayer)
export default CollectionPlayerBed
