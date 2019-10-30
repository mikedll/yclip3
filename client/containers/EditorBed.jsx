
import { connect } from 'react-redux'
import Editor from 'components/Editor.jsx'
import {
  addClip,
  startEditingCollection,
  fetchCollection,
  deleteClip } from 'actions.js'

const mapStateToProps = state => {
  return {
    ...state.editor
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addClip: (clip) => dispatch(addClip(clip)),
    fetch: ($, id) => dispatch(fetchCollection($, id, true)),
    startingEdit: collectionId => dispatch(startEditingCollection(collectionId)),
    deleteClip: ($, id, clipId) => dispatch(deleteClip($, id, clipId))
  }
}

const EditorBed = connect(mapStateToProps, mapDispatchToProps)(Editor)

export default EditorBed
