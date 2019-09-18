import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

import AjaxAssistant from 'AjaxAssistant.jsx'

export default class NewCollectionLink extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.onMakeNewCollection = this.onMakeNewCollection.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.location.pathname === `/collections/${this.state.newCollectionMade}/edit`) {
      this.setState({newCollectionMade: null})
    }
  }

  newCollectionUrl() {
    return `/me/collections/${this.state.newCollectionMade}/edit`
  }
  
  componentDidUpdate() {
    if(this.state.newCollectionMade && this.props.location.pathname.startsWith(this.newCollectionUrl())) {
      this.setState({newCollectionMade: null})
    }
  }
  
  onMakeNewCollection(e) {
    e.preventDefault()

    if(this.state.busy) return
    this.setState({busy: true})
    new AjaxAssistant(this.props.$)
      .post('/api/me/collections')
      .then(data => {
        this.setState({busy: false, newCollectionMade: data._id})
      })
      .catch(error => this.setState({error, busy: false}))
  }
  
  
  render() {
    const redirects = this.state.newCollectionMade ? (
      <Redirect push to={this.newCollectionUrl()}/>
    ) : null


    return (
      <li className='nav-item'>
        {redirects}
        <a className="nav-link" href='#' onClick={this.onMakeNewCollection}>New</a>
      </li>
    )
  }
  
}
