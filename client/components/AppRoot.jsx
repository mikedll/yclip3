
import React, { Component } from 'react'
import { Link, Route, Switch } from 'react-router-dom';

import AjaxAssistant from 'AjaxAssistant.jsx'
import CollectionViewer from 'components/CollectionViewer.jsx'
import CollectionEditor from 'components/CollectionEditor.jsx'
import NewCollectionLink from 'components/NewCollectionLink.jsx'
import CollectionsBrowser from 'components/CollectionsBrowser.jsx'

const renderMergedProps = (component, ...rest) => {
  const finalProps = Object.assign({}, ...rest);
  return (React.createElement(component, finalProps));
};

const PropsRoute = ({ component, ...rest }) => {
  return <Route {...rest} render={routeProps => { return renderMergedProps(component, routeProps, rest); }}/>;
};

class AppRoot extends Component {
  constructor(props) {
    super(props)
    this.state = {
      user: this.props.user,
      error: null
    }
    
    this.onGoogleSignIn = this.onGoogleSignIn.bind(this)
  }

  componentDidMount() {
    if(this.props.globalWindow.gOnGoogleSignInUser) {
      this.onGoogleSignin(this.props.globalWindow.gOnGoogleSigninUser)
      this.props.globalWindow.gOnGoogleSigninUser = null
    }
    else
      // I know this is supposed to be a no-no, modifying a prop (and further, one shared with child components).
      this.props.globalWindow.onGoogleSignInHook = (googleUser) => this.onGoogleSignIn(googleUser)
  }
  
  onGoogleSignIn(googleUser) {
    const idToken = googleUser.getAuthResponse().id_token
    new AjaxAssistant(this.props.jQuery).post('/api/signin', {token: idToken})
      .then(user => this.setState({user}))
      .catch(error => this.setState({error}))
  }
  
  render() {
    const welcome = () => (<div>Welcome to the application.</div>)
    const MenuLink = ({ label, to }) => (
      <Route path={to} exact children={({ match }) => (
        <li className={'nav-item' + (match ? ' active' : '')}>
          <Link className="nav-link" to={to}>{label}</Link>
        </li>
      )}/>
    );

    return (      
      <div>

        <nav className="navbar navbar-expand-lg navbar-dark">
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mr-auto">
              <MenuLink label="Home" to='/'/>
              <MenuLink label="Browse" to='/collections'/>
              <Route path="*" render={routeProps => {
                return (
                  <NewCollectionLink $={this.props.jQuery} {...routeProps} />
                )
                }}>
              </Route>
            </ul>

            <div className="sign-in-container">
              <span className="name">{this.state.user ? this.state.user.name : ""}</span>
              <div className="g-signin2" data-onsuccess="gOnSignIn" data-theme="dark"></div>
            </div>
            
          </div>
        </nav>

        <Switch>
          <PropsRoute path="/" exact component={welcome} $={this.props.jQuery}/>
          <PropsRoute path="/collections" exact component={CollectionsBrowser} $={this.props.jQuery} globalWindow={this.props.globalWindow}/>
          <PropsRoute path="/collections/:id" exact component={CollectionViewer} $={this.props.jQuery} />
          <PropsRoute path="/collections/:id/edit" exact component={CollectionEditor} $={this.props.jQuery}/>
        </Switch>
      </div>
    )
  }
  
}

export default AppRoot
