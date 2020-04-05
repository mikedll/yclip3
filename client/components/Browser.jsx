
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getUrlQueryAsObj } from 'UrlHelper.jsx'
import Paginator from 'components/Paginator.jsx'
import { Forbidden } from '../messages.js'

class Browser extends Component {

  constructor(props) {
    super(props)

    this.onDelete = this.onDelete.bind(this)
  }

  setupPages(prevProps) {
    // Discard any held pages. State transition will reveal Forbidden later.
    if(this.props.page !== -1 && this.props.browsePrivate && !this.props.user) {
      this.props.discardPages()
      return
    }

    const query = getUrlQueryAsObj()
    let qPage = 1
    try {
      qPage = query.page ? Number(query.page) : 1
    } catch(e) {
      qPage = 1
    }

    const fetchRequired = (this.props.page !== qPage)                  // no page fetched, or wrong page
          || (this.props.lastFetchPublic === this.props.browsePrivate) // old fetch cache public/private conflict

    // not getting Forbidden errors, or if we are, we just gained a user.
    const fetchOk = !(this.props.browsePrivate && this.props.error === Forbidden) || (prevProps && !prevProps.user && this.props.user)

    if(fetchRequired && fetchOk && !this.props.busy) {
      this.props.fetchPage(this.props.$, this.props.browsePrivate, qPage)
    }
  }

  onDelete(e) {
    e.preventDefault()
    if(this.props.busy) return
    
    if(this.props.globalWindow.confirm("Are you sure you want to delete this?")) {
      this.props.delete(this.props.$, this.props.$(e.target).data('ref-id'))
    }
  }
  
  componentDidUpdate(prevProps) {
    this.setupPages(prevProps)
  }
  
  componentDidMount() {
    this.setupPages()
  }

  render() {
    const thumbnails = !this.props.collections ? "" : this.props.collections.map((c) => {
      const displayTitle = c.name.trim() !== '' ? c.name : c._id
      let editLinks = null
      if(this.props.user && this.props.user._id === c.userId) {
        editLinks = (
          <span className={'edit-collection-container'}>
            <Link to={`/me/collections/${c._id}/edit`}>Edit</Link> | <a href="#" className="btn-delete" data-ref-id={c._id} onClick={this.onDelete}>Delete</a>
          </span>
        )
      }

      return (
        <div key={c._id} className="collection-brief">
          {displayTitle}
          <br/>
          Clips: {c.clips.length}
          <br/>
          <Link onClick={(e) => this.props.resetPlayerError()} to={`/collections/${c._id}`}>View</Link>
          {editLinks ? ' | ' : ''}
          {editLinks}
        </div>
      )
    })

    const { page, pages, total } = this.props
    const pagination = !this.props.page ? "" : (
      <Paginator path={(this.props.browsePrivate ? '/me/collections' : '/collections')} {...{page, pages, total}}/>
    )

    return (
      <div>
        {this.props.error !== "" ? <div className="alert alert-danger">
            {this.props.error}
        </div> : ""}

        <div className="collection-brief-container">
          {thumbnails}
          {pagination}
        </div>
      </div>
    )
  }
}

Browser.propTypes = {
  $: PropTypes.func.isRequired,
  globalWindow:  PropTypes.object,
  user: PropTypes.object,
  browsePrivate: PropTypes.bool.isRequired,
  lastFetchPublic: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  error: PropTypes.string.isRequired,
  busy: PropTypes.bool.isRequired,
  collections: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
  discardPages: PropTypes.func.isRequired,
  fetchPage: PropTypes.func.isRequired,
  delete: PropTypes.func.isRequired,
  resetPlayerError: PropTypes.func.isRequired
}

export default Browser
