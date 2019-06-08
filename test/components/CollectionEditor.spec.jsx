
import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy } from 'sinon'

import CollectionEditor from 'components/CollectionEditor.jsx'

describe('<CollectionEditor />', function() {

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
    name: "Some collection",
    clips: [clip1, clip2]
  }

  beforeEach(() => {
  })
  
  it('should fetch collection on load', () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    expect(mock$.ajax.calledWithMatch({url: '/api/collections/' + 1})).to.be.true
  })

  it('should list existing clips', async () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    expect(mock$.ajax.calledOnce).to.be.true
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    expect(wrapper.state('collection')).to.deep.equal(clipCollection1)
    wrapper.update()
    expect(wrapper.find('.clip-container')).to.have.lengthOf(2)
  })
  
  it("should record a new clip", async () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    
    wrapper.find('form input[name="vid"]').simulate('change', {target: { name: 'vid', value: 'dfjlksdjf' }})
    wrapper.find('form input[name="start"]').simulate('change', {target: { name: 'start', value: '3' }})
    wrapper.find('form input[name="duration"]').simulate('change', {target: { name: 'duration', value: '5' }})
    wrapper.find('form').simulate('submit')

    expect(mock$.ajax.calledWithMatch({
      url: '/api/collections/' + 1 + '/clips',
      data: {
      vid: 'dfjlksdjf',
      start: '3',
      duration: '5'
      }})).to.be.true

    const clipCollection2 = {
      name: "Some collection",
      clips: [clip1, clip2, {_id: 'adsf3', vid: 'dfjlksdjf', start: 3, duration: 5}]
    }
    await mock$.ajax.getCall(1).args[0].success(clipCollection2)
    wrapper.update()
    expect(wrapper.find('.clip-container')).to.have.lengthOf(3)
    expect(wrapper.find('.clip-container').last().text()).to.contain('dfjlksdjf')
  })
})
