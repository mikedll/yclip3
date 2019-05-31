
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { serializeObj, getUrlQueryAsObj } from 'UrlHelper.jsx'
import update from 'immutability-helper';
import underscore from 'underscore'
import AjaxAssistant from 'AjaxAssistant.jsx'
import Paginator from 'components/Paginator.jsx'

class CollectionsBrowser extends Component {

  constructor(props) {
    super(props)
    this.state = {
      collections: null,
      busy: false,
      stats: {},
      error: ""
    }

    this.onDelete = this.onDelete.bind(this)
  }

  retrieveIfNecessary() {
    const query = getUrlQueryAsObj()
    let qPage = 1
    try {
      qPage = query.page ? Number(query.page) : 1
    } catch(e) {
      qPage = 1
    }

    if(!this.state.stats.page || this.state.stats.page !== qPage) {
      if(this.state.busy) return
      
      this.setState({busy: true, stats: {}, collections: null})
      const nextQuery = {page: qPage}
      new AjaxAssistant(this.props.$).get('/api/collections?' + serializeObj(nextQuery))
        .then(data => {
          this.setState({busy: false, stats: underscore.pick(data, 'page', 'pages', 'total'), collections: data.results})
        })
        .catch(error => {
          this.setState({busy: false, error})
        })
    }
  }

  onDelete(e) {
    e.preventDefault()
    if(this.state.busy) return
    
    const refId = this.props.$(e.target).data('ref-id')
    if(confirm("Are you sure you want to delete this?")) {
      this.setState({busy: true})
      new AjaxAssistant(this.props.$).delete('/api/collections/' + refId)
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
  
  componentWillReceiveProps() {
    this.retrieveIfNecessary()
  }
  
  componentDidMount() {
    this.retrieveIfNecessary()
  }
  
  render() {

    const thumbnails = !this.state.collections ? "" : this.state.collections.map((c) => {
      return (
        <div key={c._id} className="collection-brief">
          {c._id} - {c.name}
          <br/>
          Clips: {c.clips.length}
          <br/>
          <Link to={`/collections/${c._id}`}>View</Link> | <Link to={`/collections/${c._id}/edit`}>Edit</Link> | <a href="#" data-ref-id={c._id} onClick={this.onDelete}>Delete</a>
        </div>
      )
    })

    const pagination = !this.state.stats.page ? "" : (
      <Paginator path="/collections" {...this.state.stats}/>
    )
    
    return (
      <div>
        {this.state.error !== "" ? <div className="alert alert-danger">
            {this.state.error}
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
