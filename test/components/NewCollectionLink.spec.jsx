

import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import { spy } from 'sinon'
import { MemoryRouter } from 'react-router-dom'
import NewCollectionLink from 'components/NewCollectionLink.jsx'

describe('<NewCollectionLink/>', function() {

  it('should present a link to user for creating a new collection', () => {
    let mock$ = spy()
    const wrapper = mount(<NewCollectionLink $={mock$}/>)
    expect(wrapper.find('a')).to.have.lengthOf(1)
    expect(wrapper.find('a').text()).to.equal('New Compilation')
  })

  it('should call server to create new compilation on click', async () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const wrapper = mount(<NewCollectionLink $={mock$}/>)

    wrapper.find('a').simulate('click')
    expect(mock$.ajax.calledWithMatch({method: 'POST', url: '/api/collections'})).to.be.true
  })

  // This one causes infinite loop from redirect -mikedll, 6/4/2019.
  it.skip('should redirect user to new collection when made', () => {
    let mock$ = spy()
    const wrapper = mount(
      <MemoryRouter initialEntries={['/somewhere']}>
        <NewCollectionLink $={mock$}/>
      </MemoryRouter>
    )

    wrapper.find('NewCollectionLink').setState({newCollectionMade: {_id: "asdf1", name: "xyz", clips: []}})
    // console.log(wrapper.html())
    // expect(wrapper.find('Router').prop('history').location.pathname).to.equal('/collections/asdf1/edit')
  })
})
