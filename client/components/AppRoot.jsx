
import React, { Component } from 'react'
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';

import jQuery from 'jquery'

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
      <Router>
        <div>

          <nav className="navbar navbar-expand-lg navbar-dark">
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <MenuLink label="Home" to='/'>Home</MenuLink>
                <MenuLink label="Browse" to='/collections'>Browse</MenuLink>
                <Route path="*" render={routeProps => {
                  return (
                    <NewCollectionLink $={jQuery} {...routeProps} />
                  )
                  }}>
                </Route>
              </ul>
            </div>
          </nav>
          
          <Switch>
            <PropsRoute path="/" exact component={welcome} $={jQuery}/>
            <PropsRoute path="/collections" exact component={CollectionsBrowser} $={jQuery} />
            <PropsRoute path="/collections/:id" exact component={CollectionViewer} $={jQuery} />
            <PropsRoute path="/collections/:id/edit" exact component={CollectionEditor} $={jQuery}/>
          </Switch>
        </div>
      </Router>
    )
  }
  
}

export default AppRoot
