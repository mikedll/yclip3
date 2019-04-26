
import React, { Component } from 'react'
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';

import jQuery from 'jquery'

import App from 'components/App.jsx'
import CollectionEditor from 'components/CollectionEditor.jsx'

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
                <Link className="nav-link" to='/'>Home</Link>
                <Link className="nav-link" to='/collections'>Browse</Link>
                <Link className="nav-link" to='/collections/e35/edit'>Edit a Collection</Link>
              </ul>
            </div>
          </nav>
          
          <Switch>
            <PropsRoute path="/" exact component={App} $={jQuery} clips={this.props.bootstrap}/>
            <PropsRoute path="/collections/:id" exact component={App} $={jQuery} collection={this.props.bootstrap}/>
            <PropsRoute path="/collections/:id/edit" component={CollectionEditor} $={jQuery}/>
          </Switch>
        </div>
      </Router>
    )
  }
  
}

export default AppRoot
