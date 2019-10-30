
import React, { Component } from 'react'
import { Link, Route, Switch } from 'react-router-dom';

import AjaxAssistant from 'AjaxAssistant.jsx'
import CollectionPlayerBed from 'containers/CollectionPlayerBed.jsx'
import EditorBed from 'containers/EditorBed.jsx'
import NewCollectionLink from 'containers/NewCollectionLink.jsx'
import BrowseBed from 'containers/BrowseBed.jsx'

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
    this.onLogout = this.onLogout.bind(this)
  }

  componentDidMount() {
    if(this.props.globalWindow.gOnGoogleSignInUser) {
      // This component's code was later than google's code.
      let googleUser = this.props.globalWindow.gOnGoogleSigninUser
      this.props.globalWindow.gOnGoogleSigninUser = null
      this.onGoogleSignin(googleUser)
    }
    else {
      // This component's code loaded faster than google's signin recognition code. Or, user signed in interactively,
      // after not being signed in.
      
      // Also, I know this is supposed to be a no-no, modifying a prop (and further, one shared with child components).
      // But it's the global window.
      
      this.props.globalWindow.onGoogleSignInHook = (googleUser) => this.onGoogleSignIn(googleUser)
    }
  }
  
  onGoogleSignIn(googleUser) {
    const idToken = googleUser.getAuthResponse().id_token
    new AjaxAssistant(this.props.jQuery).post('/api/sessions/signin', {token: idToken})
      .then(user => this.setState({user}))
      .catch(error => this.setState({error}))
  }

  onLogout() {
    var auth2 = this.props.globalWindow.gapi.auth2.getAuthInstance();
    auth2.signOut()
      .then(_ => new AjaxAssistant(this.props.jQuery).get('/api/sessions/signout'))
      .then(_ => this.setState({user: null}))
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

    // Have to have hidden signin button even when logged in, or logout doesn't work.
    const userLoginArea = this.state.user ? (
      <div className="sign-in-container">
        <div className="g-signin2 d-none" data-onsuccess="gOnSignIn" data-theme="dark"></div>
        <span className="name mr-2">{this.state.user ? this.state.user.name : ""}</span>
        <div className="btn btn-info logout" onClick={this.onLogout}>Logout</div>
      </div>
    ) : (
      <div className="sign-in-container">
        <div className="g-signin2" data-onsuccess="gOnSignIn" data-theme="dark"></div>
      </div>
    )
    return (      
      <div>

        <nav className="navbar navbar-expand-lg navbar-dark">
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mr-auto">
              <MenuLink label="Home" to='/'/>
              <MenuLink label="Yours" to='/me/collections'/>
              <MenuLink label="Public" to='/collections'/>
              <Route path="*" render={routeProps => {
                return (
                  <NewCollectionLink $={this.props.jQuery} {...routeProps} />
                )
                }}>
              </Route>
            </ul>

            {userLoginArea}
          </div>
        </nav>

        <Switch>
          <PropsRoute path="/" exact component={welcome} $={this.props.jQuery}/>
          <PropsRoute path="/me/collections" exact component={BrowseBed} $={this.props.jQuery}
            globalWindow={this.props.globalWindow} user={this.state.user} browsePrivate={true}/>
          <PropsRoute path="/collections" exact component={BrowseBed} $={this.props.jQuery}
            globalWindow={this.props.globalWindow} user={this.state.user} browsePrivate={false}/>
          <PropsRoute path="/collections/:id" exact component={CollectionPlayerBed} $={this.props.jQuery} />
          <PropsRoute path="/me/collections/:id/edit" exact
            globalWindow={this.props.globalWindow}
            component={EditorBed} $={this.props.jQuery}/>
        </Switch>
      </div>
    )
  }
  
}

export default AppRoot
