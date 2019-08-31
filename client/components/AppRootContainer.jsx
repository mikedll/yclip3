
import React, { Component} from 'react'
import { BrowserRouter as Router } from 'react-router-dom';

import AppRoot from 'components/AppRoot.jsx'

// This container helps with testing the AppRoot.
class AppRootContainer extends Component {

  render() {
    return (
      <Router>
        <AppRoot user={this.props.user} jQuery={this.props.jQuery} globalWindow={this.props.globalWindow}/>
      </Router>
    )
  }
}

export default AppRootContainer
