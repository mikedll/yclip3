
import { connect } from 'react-redux'
import Editor from 'components/Editor.jsx'
import {
  addClip,
  startEditingCollection,
  fetchCollection,
  deleteClip,
  updateClipOrder,
  updateCollection } from 'actions.js'

const mapStateToProps = (state, ownProps) => {
  return {
    ...state.editor, ...ownProps
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addClip: (clip) => dispatch(addClip(clip)),
    fetch: ($, id) => dispatch(fetchCollection($, id, true)),
    startingEdit: collectionId => dispatch(startEditingCollection(collectionId)),
    deleteClip: ($, id, clipId) => dispatch(deleteClip($, id, clipId)),
    updateClipOrder: ($, id, ordering) => dispatch(updateClipOrder($, id, ordering)),
    update: ($, id, attrs) => dispatch(updateCollection($, id, attrs))
  }
}

const EditorBed = connect(mapStateToProps, mapDispatchToProps)(Editor)

export default EditorBed
