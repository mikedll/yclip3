
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
    return (
      <div className="collection-brief-container">

        {this.state.error !== "" ? <div className="alert alert-danger">
            {this.state.error}
        </div> : ""}
        
        {this.state.collections ? this.state.collections.map((c) => { return (<div className="collection-brief">
                                                                              {c._id} - {c.name}
                                                                                <br/>
                                                                                  <Link to={`/collections/${c._id}`}>View</Link>
                                                                              </div>
                                                                             ) }) : ""}
      </div>
    )
  }
}

export default CollectionsBrowser
