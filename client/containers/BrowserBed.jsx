
import { connect } from 'react-redux'
import Browser from 'components/Browser.jsx'
import {
  fetchBrowsePage,
  browseDelete,
  discardPages
} from 'actions.js'

const mapStateToProps = (state, ownProps) => {
  return {...state.browser, ...ownProps}
}

const mapDispatchToProps = dispatch => {
  return {
    discardPages: () => dispatch(discardPages()),
    fetchPage: ($, isPrivate, page) => dispatch(fetchBrowsePage($, isPrivate, page)),
    delete: ($, id) => dispatch(browseDelete($, id))
  }
}

const BrowserBed = connect(mapStateToProps, mapDispatchToProps)(Browser)
export default BrowserBed
