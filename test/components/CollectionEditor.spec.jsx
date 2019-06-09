
import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy, stub } from 'sinon'

import CollectionEditor from 'components/CollectionEditor.jsx'

describe('<CollectionEditor />', function() {

  let clip1 = {
    _id: "asdf1",
    vid:"Iwuy4hHO3YQ",
    start: 5399,
    duration: 46.331
  }, clip2 = {
    _id: "asdf2",
    "vid":"dQw4w9WgXcQ",
    "start":180,
    "duration":35
  }, clipCollection1 = {
    _id: "asdf0",
    name: "Some collection",
    clips: [clip1, clip2]
  }

  beforeEach(() => {
  })
  
  it('should fetch collection on load', () => {
    let mock$ = stub().returns({sortable: spy()})
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    expect(mock$.ajax.calledWithMatch({url: '/api/collections/' + 1})).to.be.true
  })

  it('should list existing clips', async () => {
    let mock$ = stub().returns({sortable: spy()})
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
    let mock$ = stub().returns({sortable: spy()})
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    
    wrapper.find('form input[name="vid"]').simulate('change', {target: { name: 'vid', value: 'dfjlksdjf' }})
    wrapper.find('form input[name="start"]').simulate('change', {target: { name: 'start', value: '3:00' }})
    wrapper.find('form input[name="end"]').simulate('change', {target: { name: 'end', value: '3:35' }})
    wrapper.find('form').simulate('submit')

    expect(mock$.ajax.calledWithMatch({
      url: '/api/collections/' + 1 + '/clips',
      data: {
      vid: 'dfjlksdjf',
      start: '3:00',
      end: '3:35'
      }})).to.be.true

    const clipCollection2 = {
      name: "Some collection",
      clips: [clip1, clip2, {_id: 'adsf3', vid: 'dfjlksdjf', start: 180, duration: 35}]
    }
    await mock$.ajax.getCall(1).args[0].success(clipCollection2)
    wrapper.update()
    expect(wrapper.find('.clip-container')).to.have.lengthOf(3)
    expect(wrapper.find('.clip-container').last().text()).to.contain('dfjlksdjf')
  })

  it('should render start and end times', async() => {
    let mock$ = stub().returns({sortable: spy()})
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    wrapper.update()

    const firstClip = wrapper.find('.clip-container').first()
    expect(firstClip.find('td').at(1).text()).to.equal('1:29:59')
    expect(firstClip.find('td').at(2).text()).to.equal('1:30:45.331')
    
    const secondClip = wrapper.find('.clip-container').last()
    expect(secondClip.find('td').at(1).text()).to.equal('3:00')
    expect(secondClip.find('td').at(2).text()).to.equal('3:35')    
  })

  it('should permit name editing', async () => {
    let mock$ = stub().returns({sortable: spy()})
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    wrapper.update()

    wrapper.find('.name-container').simulate('click')
    expect(wrapper.find('.name-editor')).to.have.lengthOf(1)
    wrapper.find('.name-editor').find('input').simulate('change', {target: {name: 'collection[name]', value: 'nice poems'}})
    wrapper.find('.name-editor form').simulate('submit')

    expect(mock$.ajax.calledWithMatch({
      url: '/api/collections/' + 1,
      method: 'PUT',
      data: {
        name: 'nice poems'
    }})).to.be.true

    clipCollection1.name = 'nice poems'
    await mock$.ajax.getCall(1).args[0].success(clipCollection1)
    wrapper.update()
    
    expect(wrapper.find('.name-editor')).to.have.lengthOf(0)

  })

  it.only('should permit clip deletion', async () => {
    let mock$ = stub().returns({sortable: spy()})
    mock$.ajax = spy()
    const matchProps = { params: { id: clipCollection1._id } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    wrapper.update()

    expect(wrapper.find('.clip-container')).to.have.lengthOf(2)
    wrapper.find('.clip-container .btn-delete').first().simulate('click')

    expect(mock$.ajax.calledWithMatch({
      url: '/api/collections/' + clipCollection1._id + '/clips/' + clip1._id,
      method: 'DELETE',
    })).to.be.true

    await mock$.ajax.getCall(1).args[0].success(null)
    wrapper.update()
    
    expect(wrapper.find('.clip-container')).to.have.lengthOf(1)
    expect(wrapper.find('.clip-container').key()).to.equal(clip2._id)
  })
  
})
