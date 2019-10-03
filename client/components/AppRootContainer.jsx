
import React, { Component} from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { createStore } from 'redux'
import { Provider } from 'react-redux'

import AppRoot from 'components/AppRoot.jsx'

import { rootReducer } from '../reducers.js'

const store = createStore( rootReducer )

// This container helps with testing the AppRoot.
class AppRootContainer extends Component {

  render() {
    return (
      <Provider store={store}>
        <Router>
          <AppRoot user={this.props.user} jQuery={this.props.jQuery} globalWindow={this.props.globalWindow}/>
        </Router>
      </Provider>
    )
  }
}

export default AppRootContainer
