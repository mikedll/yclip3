
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { getUrlQueryAsObj } from 'UrlHelper.jsx'
import update from 'immutability-helper';
import underscore from 'underscore'
import AjaxAssistant from 'AjaxAssistant.jsx'
import Paginator from 'components/Paginator.jsx'

class CollectionsBrowser extends Component {

  constructor(props) {
    super(props)

    this.onDelete = this.onDelete.bind(this)
  }

  retrieveIfNecessary(prevProps) {
    const query = getUrlQueryAsObj()
    let qPage = 1
    try {
      qPage = query.page ? Number(query.page) : 1
    } catch(e) {
      qPage = 1
    }

    const fetchRequired =
          (prevProps && prevProps.browsePrivate !== this.props.browsePrivate) // jumped between public/private
          || (!this.props.page || this.props.page !== qPage)                  // no page fetched, or wrong page

    const fetchOk = !(this.props.browsePrivate && this.props.error === 'That resource is forbidden to you')

    if(fetchRequired && fetchOk) {
      if(this.props.busy) return
      this.props.fetchPage(this.props.$, (this.props.browsePrivate ? '/api/me/collections' : '/api/collections'), qPage)
    }
  }

  onDelete(e) {
    e.preventDefault()
    if(this.state.busy) return
    
    const refId = this.props.$(e.target).data('ref-id')
    if(this.props.globalWindow.confirm("Are you sure you want to delete this?")) {
      this.setState({busy: true})
      new AjaxAssistant(this.props.$).delete('/api/me/collections/' + refId)
        .then(_ => {
          this.setState(prevState => {
            const index = underscore.findIndex(prevState.collections, el => el._id === refId)
            return update(prevState, {'busy': {$set: false}, 'collections': {$splice: [[index, 1]]}})
          })
        })
        .catch(error => {
          this.setState({busy: false, error})
        })
    }
  }
  
  componentDidUpdate(prevProps) {
    this.retrieveIfNecessary(prevProps)
  }
  
  componentDidMount() {
    this.retrieveIfNecessary()
  }

  render() {
    const thumbnails = !this.props.collections ? "" : this.props.collections.map((c) => {
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
          {c._id} - {c.name}
          <br/>
          Clips: {c.clips.length}
          <br/>
          <Link to={`/collections/${c._id}`}>View</Link>
          {editLinks ? ' | ' : ''}
          {editLinks}
        </div>
      )
    })

    const { page, pages, total } = this.props
    const pagination = !this.props.page ? "" : (
      <Paginator path="/collections" {...{page, pages, total}}/>
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

export default CollectionsBrowser
