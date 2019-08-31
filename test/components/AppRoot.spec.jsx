
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
    clips: []
  }, col2 = {
    _id: "adsf2",
    name: "",
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

    expect(wrapper.find('.sign-in-container .name').text()).to.equal('')
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
    mockW.gapi.auth2.getAuthInstance.returns({
      signOut: function() { return new Promise((resolve, reject) => { resolve() }) }
    })
    mock$.ajax = spy()
    let wrapper = mount(
      <Router initialEntries={['/']}>
        <AppRoot user={{name: 'Mike Rivers'}} jQuery={mock$} globalWindow={mockW}/>
      </Router>
    )
    expect(wrapper.find('.sign-in-container .name').text()).to.equal('Mike Rivers')

    await wrapper.find('.sign-in-container .btn.logout').simulate('click')
    expect(mock$.ajax.calledWithMatch({url: '/api/signout'})).to.be.true

    // fake server completion
    await mock$.ajax.getCall(0).args[0].success(null)
    
    expect(wrapper.find('.sign-in-container .name').text()).to.equal('')
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
    expect(mock$.ajax.calledWithMatch({url: '/api/signin', method: 'POST', data: {token: 'unused_token'}})).to.be.true

    // fake return call from server
    await mock$.ajax.getCall(0).args[0].success({name: 'Mike Rivers', id: 'SomeID'})

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
    
    expect(wrapper.find('.navbar-nav li a')).to.have.lengthOf(3) // Home, Browse, New Collection
    expect(wrapper.find('.navbar-nav li a').first().text()).to.equal('Home')
    expect(wrapper.find('.navbar-nav li a').at(1).text()).to.equal('Browse')
    expect(wrapper.find('.collection-brief')).to.have.lengthOf(2)
  })
  
})
