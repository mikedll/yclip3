
import { connect } from 'react-redux'
import CollectionEditor from 'components/CollectionEditor.jsx'
import { addClip } from 'actions.js'

const mapStateToProps = state => {
  return {
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addClip: (clip) => dispatch(addClip(clip))
  }
}

const CollectionEditorBed = connect(mapStateToProps, mapDispatchToProps)(CollectionEditor)

export default CollectionEditorBed
