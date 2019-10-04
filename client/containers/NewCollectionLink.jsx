import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

import { fetchNewCollection } from '../actions.js'
import AjaxAssistant from 'AjaxAssistant.jsx'

class NewCollectionLink extends Component {
  constructor(props) {
    super(props)
  }

  newCollectionUrl() {
    return `/me/collections/${this.props.newCollectionId}/edit`
  }
    
  render() {
    const redirects = this.props.newCollectionId ? (
      <Redirect push to={this.newCollectionUrl()}/>
    ) : null

    const { onRequestNew, $ } = this.props
    return (
      <li className='nav-item'>
        {redirects}
        <a className="nav-link" href='#' onClick={e => {
            e.preventDefault()
            onRequestNew($)
          }}>New</a>
      </li>
    )
  }
  
}

const mapStateToProps = state => ({
  newCollectionId: state.newCollectionId ? state.newCollectionId : null
})

const mapDispatchToProps = dispatch => ({
  onRequestNew: ($) => {
    dispatch(fetchNewCollection($))
  }
})

const connected = connect(mapStateToProps, mapDispatchToProps)(NewCollectionLink)
export default connected
