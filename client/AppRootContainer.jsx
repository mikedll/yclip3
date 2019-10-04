
import React, { Component} from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import makeStore from 'makeStore.js'
import AppRoot from 'AppRoot.jsx'


// This container helps with testing the AppRoot.
class AppRootContainer extends Component {

  render() {
    return (
      <Provider store={makeStore()}>
        <Router>
          <AppRoot user={this.props.user} jQuery={this.props.jQuery} globalWindow={this.props.globalWindow}/>
        </Router>
      </Provider>
    )
  }
}

export default AppRootContainer
