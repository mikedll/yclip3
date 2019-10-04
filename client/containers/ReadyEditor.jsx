import { connect } from 'react-redux'

import { startEditingCollection } from '../actions.js'

import CollectionEditor from '../components/CollectionEditor.jsx'

const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({
  startingEdit: collectionId => dispatch(startEditingCollection(collectionId))
})

const ReadyEditor = connect(mapStateToProps, mapDispatchToProps)(CollectionEditor)
export default ReadyEditor
