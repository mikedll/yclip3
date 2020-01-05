
import { connect } from 'react-redux'
import underscore from 'underscore'
import Editor from 'components/Editor.jsx'
import {
  addClip,
  startEditingCollection,
  fetchCollection,
  deleteClip,
  updateClipOrder,
  updateCollection } from 'actions.js'

const mapStateToProps = (state, ownProps) => {
  const collection = state.editor.collectionId ? state.collections[state.editor.collectionId] : null
  return {
    ...underscore.pick(state.editor, 'error', 'busy'),
    collection,
    ...ownProps
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addClip: ($, id, clip) => dispatch(addClip($, id, clip)),
    fetch: ($, id) => dispatch(fetchCollection($, id, true)),
    startingEdit: collectionId => dispatch(startEditingCollection(collectionId)),
    deleteClip: ($, id, clipId) => dispatch(deleteClip($, id, clipId)),
    updateClipOrder: ($, id, ordering) => dispatch(updateClipOrder($, id, ordering)),
    update: ($, id, attrs) => dispatch(updateCollection($, id, attrs))
  }
}

const EditorBed = connect(mapStateToProps, mapDispatchToProps)(Editor)

export default EditorBed
