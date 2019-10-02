
import { expect } from 'chai'
import React from 'react';
import { MemoryRouter as Router } from 'react-router-dom'
import { configure, shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy, stub } from 'sinon'

import AppRoot from 'components/AppRoot.jsx'

describe('<AppRoot />', () => {

  let col1 = {
    _id: 'asdf1',
    name: "",
    isPublic: true,
    clips: []
  }, col2 = {
    _id: "adsf2",
    name: "",
    isPublic: true,
    clips: []
  }

  it('should display no name when logged out', async () => {
    let mock$ = spy()
    let mockW = spy()
    mock$.ajax = spy()
    let wrapper = mount(
      <Router initialEntries={['/']}>
        <AppRoot user={null} jQuery={mock$} globalWindow={mockW}/>
      </Router>
    )

    expect(wrapper.find('.sign-in-container .name')).to.have.lengthOf(0)
  })
  
  it('should display username when logged in', async () => {
    let mock$ = spy()
    let mockW = spy()
    mock$.ajax = spy()
    let wrapper = mount(
      <Router initialEntries={['/']}>
        <AppRoot user={{name: "Mike Rivers"}} jQuery={mock$} globalWindow={mockW}/>
      </Router>
    )

    expect(wrapper.find('.sign-in-container .name').text()).to.equal('Mike Rivers')
  })

  it('should reflect runtime logout', async () => {
    let mock$ = spy()
    let mockW = spy()

    mockW.gapi = {
      auth2: {
        getAuthInstance: stub()
      }
    }

    let promiseQueue = []
    let promiseChainSimulator = {
      then: function(callback) {
        promiseQueue.push(callback)
        return this
      },
      catch(onErrorCallback) {
        // presume not called.
        onErrorCallback()
      }
    }
    
    let authInst = {
      signOut: function() {
        return promiseChainSimulator
      }
    }

    mockW.gapi.auth2.getAuthInstance.returns(authInst)
    
    mock$.ajax = spy()
    let wrapper = mount(
      <Router initialEntries={['/']}>
        <AppRoot user={{name: 'Mike Rivers'}} jQuery={mock$} globalWindow={mockW}/>
      </Router>
    )
    expect(wrapper.find('.sign-in-container .name').text()).to.equal('Mike Rivers')

    wrapper.find('.sign-in-container .btn.logout').simulate('click')
    promiseQueue[0]() // sets up ajax assistant and calls .get on it
    expect(mock$.ajax.calledWithMatch({url: '/api/sessions/signout'})).to.be.true

    // fake server completion
    mock$.ajax.getCall(0).args[0].success(null)
    promiseQueue[1]() // calls setting user to null

    wrapper.update() // without this, there is a conflict in enzyme on what the resulting html is
    expect(wrapper.find('.sign-in-container .name')).to.have.lengthOf(0)
  })
  
  it('should swap in user on interactive login', async () => {
    let mock$ = spy()
    let mockW = spy()
    mock$.ajax = spy()
    let wrapper = mount(
      <Router initialEntries={['/']}>
        <AppRoot user={null} jQuery={mock$} globalWindow={mockW}/>
      </Router>
    )

    let googleUserStub = {
      getAuthResponse: stub()
    }
    googleUserStub.getAuthResponse.returns({id_token: 'unused_token'})

    mockW.onGoogleSignInHook(googleUserStub)
    expect(mock$.ajax.calledWithMatch({url: '/api/sessions/signin', method: 'POST', data: {token: 'unused_token'}})).to.be.true

    // fake return call from server
    await mock$.ajax.getCall(0).args[0].success({name: 'Mike Rivers', id: 'SomeID'})

    wrapper.update() // enzyme in conflict without this
    expect(wrapper.find('.sign-in-container .name').text()).to.equal('Mike Rivers')
  })  
  
  it('should render /collections without error', async () => {
    let mock$ = spy()
    let mockW = spy()
    mock$.ajax = spy()
    let wrapper = mount(
      <Router initialEntries={['/collections']}>
        <AppRoot jQuery={mock$} globalWindow={mockW}/>
      </Router>
    )

    await mock$.ajax.getCall(0).args[0].success({
      page: 1,
      pages: 1,
      total: 2,
      results: [col1, col2]
    })
    wrapper.update()
    
    expect(wrapper.find('.navbar-nav li a')).to.have.lengthOf(4) // Home, Browse, New Collection
    expect(wrapper.find('.navbar-nav li a').first().text()).to.equal('Home')
    expect(wrapper.find('.navbar-nav li a').at(2).text()).to.equal('Public')
    expect(wrapper.find('.collection-brief')).to.have.lengthOf(2)
  })
  
})
