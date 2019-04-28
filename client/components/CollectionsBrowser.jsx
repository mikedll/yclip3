
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { serializeObj, getUrlQueryAsObj } from 'UrlHelper.jsx'
import _ from 'underscore'
import AjaxAssistant from 'AjaxAssistant.jsx'
import Paginator from 'components/Paginator.jsx'

class CollectionsBrowser extends Component {

  constructor(props) {
    super(props)
    this.state = {
      collections: null,
      retrieving: false,
      stats: {},
      error: ""
    }
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
      if(this.state.retrieving) return
      
      this.setState({retrieving: true, stats: {}, collections: null})
      const nextQuery = {page: qPage}
      new AjaxAssistant(this.props.$).get('/api/collections?' + serializeObj(nextQuery))
        .then(data => {
          this.setState({retrieving: false, stats: _.pick(data, 'page', 'pages', 'total'), collections: data.results})
        })
        .catch(error => {
          this.setState({retrieving: false, error})
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

    const thumbnails = !this.state.collections ? "" : this.state.collections.map((c, i) => {
      return (
        <div key={i} className="collection-brief">
          {c._id} - {c.name}
          <br/>
          Clips: {c.clips.length}
          <br/>
          <Link to={`/collections/${c._id}`}>View</Link>  | <Link to={`/collections/${c._id}/edit`}>Edit</Link>
        </div>
      )
    })

    const pagination = !this.state.stats.page ? "" : (
      <Paginator path="/collections" {...this.state.stats}/>
    )
    
    return (
      <div className="collection-brief-container">

        {this.state.error !== "" ? <div className="alert alert-danger">
            {this.state.error}
        </div> : ""}
        
        {thumbnails}

        {pagination}
      </div>
    )
  }
}

export default CollectionsBrowser
