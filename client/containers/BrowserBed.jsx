
import { connect } from 'react-redux'
import Browser from 'components/Browser.jsx'
import { fetchBrowsePage, browseDelete } from 'actions.js'

const mapStateToProps = (state, ownProps) => {
  return {...state.browser, ...ownProps}
}

const mapDispatchToProps = dispatch => {
  return {
    fetchPage: ($, isPrivate, page) => dispatch(fetchBrowsePage($, isPrivate, page)),
    delete: ($, id) => dispatch(browseDelete($, id))
  }
}

const BrowserBed = connect(mapStateToProps, mapDispatchToProps)(Browser)
export default BrowserBed
