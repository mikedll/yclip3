
import React, { Component } from 'react'
import { BrowserRouter as Router, Link, Route, Switch, Redirect } from 'react-router-dom';

import jQuery from 'jquery'

import AjaxAssistant from 'AjaxAssistant.jsx'
import CollectionViewer from 'components/CollectionViewer.jsx'
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
    this.state = {}
    this.onNewCollection = this.onNewCollection.bind(this)
  }

  onNewCollection(e) {
    e.preventDefault()
    if(this.state.busy) return
    this.setState({busy: true})
    new AjaxAssistant(jQuery)
      .post('/api/collections')
      .then(data => {
        this.setState({busy: false, newCollectionMade: data._id})
      })
      .catch(error => this.setState({error, busy: false}))
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

    const redirects = !this.state.newCollectionMade ? "" : (
      <Redirect to={`/collections/${this.state.newCollectionMade}/edit`}/>
    )

    return (      
      <Router>
        <div>
          {redirects}

          <nav className="navbar navbar-expand-lg navbar-dark">
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <MenuLink label="Home" to='/'>Home</MenuLink>
                <MenuLink label="Browse" to='/collections'>Browse</MenuLink>
                <MenuLink label="View a Collection" to='/collections/e35'></MenuLink>
                <MenuLink label="Edit a Collection" to='/collections/e35/edit'></MenuLink>
                <li className='nav-item'>
                  <a className="nav-link" href='#' onClick={this.onNewCollection}>New Clip Collection</a>
                </li>
              </ul>
            </div>
          </nav>
          
          <Switch>
            <PropsRoute path="/" exact component={welcome} $={jQuery}/>
            <PropsRoute path="/collections/:id" exact component={CollectionViewer} $={jQuery} />
            <PropsRoute path="/collections/:id/edit" component={CollectionEditor} $={jQuery}/>
          </Switch>
        </div>
      </Router>
    )
  }
  
}

export default AppRoot
