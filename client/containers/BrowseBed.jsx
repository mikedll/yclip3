
import { connect } from 'react-redux'
import CollectionsBrowser from 'components/CollectionsBrowser.jsx'
import { fetchBrowsePage, browseDelete } from 'actions.js'

const mapStateToProps = (state, ownProps) => {
  return {...state.browser, ...ownProps}
}

const mapDispatchToProps = dispatch => {
  return {
    fetchPage: ($, path, page) => dispatch(fetchBrowsePage($, path, page)),
    delete: ($, id) => dispatch(browseDelete($, id))
  }
}

const BrowseBed = connect(mapStateToProps, mapDispatchToProps)(CollectionsBrowser)
export default BrowseBed
