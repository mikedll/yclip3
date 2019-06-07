
import React, { Component} from 'react'
import { BrowserRouter as Router } from 'react-router-dom';

import AppRoot from 'components/AppRoot.jsx'

class AppRootContainer extends Component {

  render() {
    return (
      <Router>
        <AppRoot jQuery={this.props.jQuery} globalWindow={this.props.globalWindow}/>
      </Router>
    )
  }
}

export default AppRootContainer
