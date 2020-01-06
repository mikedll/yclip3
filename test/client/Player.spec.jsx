
import React from 'react'
import { spy } from 'sinon'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'

import Player from 'components/Player.jsx'

describe('<Player/>', function() {
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
    const mockProps = {
      match: { params: { id: clipCollection1._id } },
      $: spy(),
      fetch: spy(),
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
      <Player {...mockProps}/>
    )

    expect(mockProps.fetch.calledOnce).to.be.true
    wrapper.setProps({collection: clipCollection1})
    expect(wrapper.find('tbody tr')).to.have.lengthOf(2)
  })

  it('should permit jumping to a specific clip', () => {
    const mockProps = {
      match: { params: { id: clipCollection1._id } },
      $: spy(),
      fetch: spy(),
      error: "",
      seeking: spy(),
      busy: false,
      collection: clipCollection1,
      clipCheckIsDue: false,
      onVideoEnd: spy(),
      enteredPlaying: spy(),
      nextClipOrScheduleCheck: spy(),
      shutdown: spy(),
      jumpTo: spy()
    }
    const wrapper = mount(
      <Player {...mockProps}/>
    )
    wrapper.find('.clip-summary tbody tr').at(1).find('a.jump-link').simulate('click')
    expect(mockProps.jumpTo.getCall(0).args[0]).to.equal(1)
  })
  
  
})
