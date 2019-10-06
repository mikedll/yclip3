
import React from 'react'
import { spy } from 'sinon'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'

import CollectionPlayer from 'components/CollectionPlayer.jsx'

describe('<CollectionPlayer/>', function() {
  let clip1 = {
    _id: "asdf1",
    vid:"Iwuy4hHO3YQ",
    start: 34,
    duration: 3
  }, clip2 = {
    _id: "asdf2",
    "vid":"dQw4w9WgXcQ",
    "start":43,
    "duration":3
  }, clipCollection1 = {
    _id: "asdf1",
    name: "Some collection",
    clips: [clip1, clip2]
  }

  it('should fetch clips and present them in table', async () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const mockMatch = { params: { id: clipCollection1._id } }
    const wrapper = mount(
      <CollectionPlayer $={mock$} match={mockMatch}/>
    )

    expect(mock$.ajax.calledWithMatch({url: '/api/collections/' + clipCollection1._id})).to.be.true
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    wrapper.update()
    expect(wrapper.find('tbody tr')).to.have.lengthOf(2)
  })
})
