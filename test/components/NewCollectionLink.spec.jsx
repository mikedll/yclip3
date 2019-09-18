

import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import { spy } from 'sinon'
import { MemoryRouter, Route } from 'react-router-dom'
import NewCollectionLink from 'components/NewCollectionLink.jsx'

describe('<NewCollectionLink/>', function() {

  it('should present a link to user for creating a new collection', () => {
    let mock$ = spy()
    const wrapper = mount(<NewCollectionLink $={mock$}/>)
    expect(wrapper.find('a')).to.have.lengthOf(1)
    expect(wrapper.find('a').text()).to.equal('New')
  })

  it('should call server to create new compilation on click', async () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const wrapper = mount(<NewCollectionLink $={mock$}/>)

    wrapper.find('a').simulate('click')
    expect(mock$.ajax.calledWithMatch({method: 'POST', url: '/api/me/collections'})).to.be.true
  })

  // This one causes infinite loop from redirect -mikedll, 6/4/2019.
  it('should redirect user to new collection when made', () => {
    let mock$ = spy()
    const wrapper = mount(
      <MemoryRouter initialEntries={['/somewhere']}>
        <Route path="*" render={routeProps => {
          return (
            <NewCollectionLink $={mock$} {...routeProps} />
          )
        }}>
        </Route>
      </MemoryRouter>
    )

    wrapper.find('NewCollectionLink').setState({newCollectionMade: "asdf1"})
    expect(wrapper.find('Router').prop('history').location.pathname).to.equal('/me/collections/asdf1/edit')
  })
})
