
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
    let fetch = spy()
    const mockMatch = { params: { id: clipCollection1._id } }
    const mockProps = {
      $: spy(),
      error: "",
      seeking: spy(),
      busy: false,
      clipCheckIsDue: false,
      onVideoEnd: spy(),
      enteredPlaying: spy(),
      nextClipOrScheduleCheck: spy(),
      shutdown: spy(),
      jumpTo: spy()
    }
    const wrapper = mount(
      <CollectionPlayer fetch={fetch} match={mockMatch} {...mockProps}/>
    )

    expect(fetch.calledOnce).to.be.true
    wrapper.setProps({collection: clipCollection1})
    expect(wrapper.find('tbody tr')).to.have.lengthOf(2)
  })
})
