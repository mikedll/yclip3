
import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import AjaxAssistant from 'AjaxAssistant.jsx'

class CollectionsBrowser extends Component {

  constructor(props) {
    super(props)
    this.state = {
      collections: null,
      error: ""
    }
  }

  componentDidMount() {
    if(!this.state.collections) {
      new AjaxAssistant(this.props.$).get('/api/collections')
        .then(data => {
          this.setState({collections: data})
        })
        .catch(error => {
          this.setState({error})
        })
    }
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

    return (
      <div className="collection-brief-container">

        {this.state.error !== "" ? <div className="alert alert-danger">
            {this.state.error}
        </div> : ""}
        
        {thumbnails}
      </div>
    )
  }
}

export default CollectionsBrowser
