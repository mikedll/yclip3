
import { connect } from 'react-redux'
import CollectionBrowser from 'components/CollectionBrowser.jsx'
import { fetchBrowsePage } from 'actions.js'

const mapStateToProps = (state, ownProps) => {
  return {...state.browser, ...ownProps}
}

const mapDispatchToProps = dispatch => {
  return {
    fetchPage: ($, path, page) => dispatch(fetchBrowsePage($, path, page))
  }
}

const BrowseBed = connect(mapStateToProps, mapDispatchToProps)(CollectionBrowser)
export default BrowseBed
