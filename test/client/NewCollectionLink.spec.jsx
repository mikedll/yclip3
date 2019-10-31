

import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import { spy } from 'sinon'
import { MemoryRouter, Route } from 'react-router-dom'

import { Provider } from 'react-redux'

import makeStore from 'makeStore.js'
import { receiveNewCollection } from 'actions.js'

import NewCollectionLink from 'containers/NewCollectionLink.jsx'
import EditorBed from 'containers/EditorBed.jsx'

describe('<NewCollectionLink/>', function() {

  it('should present a link to user for creating a new collection', () => {
    const store = makeStore()
    let mock$ = spy()
    mock$.ajax = spy()
    
    const wrapper = mount(
      <Provider store={store}>
        <NewCollectionLink $={mock$}/>
      </Provider>
    )

    expect(wrapper.find('a')).to.have.lengthOf(1)
    expect(wrapper.find('a').text()).to.equal('New')
  })

  it('should call server to create new compilation on click', async () => {
    const store = makeStore()
    let mock$ = spy()
    mock$.ajax = spy()
    
    const wrapper = mount(
      <Provider store={store}>
        <NewCollectionLink $={mock$}/>
      </Provider>
    )

    wrapper.find('a').simulate('click')
    expect(mock$.ajax.calledWithMatch({method: 'POST', url: '/api/me/collections'})).to.be.true
  })

  // This one causes infinite loop from redirect -mikedll, 6/4/2019.
  it('should redirect user to new collection when made', () => {
    const store = makeStore()
    let mock$ = spy()
    mock$.ajax = spy()
    
    // Right now, this depends on EditorBed to tell it when the redirect has succeeded. Else, there's an infinite loop.
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/somewhere']}>
          <Route path="*" render={routeProps => {
              return (
                <NewCollectionLink $={mock$} {...routeProps} />
              )
          }}>
          </Route>
          <Route path="/me/collections/:id/edit" exact render={routeProps => <EditorBed {...routeProps} $={mock$}/>}/>
        </MemoryRouter>
      </Provider>
    )

    store.dispatch(receiveNewCollection({_id: 'asdf1'}))
    expect(wrapper.find('Router').prop('history').location.pathname).to.equal('/me/collections/asdf1/edit')
  })
})
