
import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy, stub, fake } from 'sinon'
import { MemoryRouter } from 'react-router-dom'

import makeStore from 'makeStore.js'
import { Provider } from 'react-redux'
import Editor from 'components/Editor.jsx'
import EditorBed from 'containers/EditorBed.jsx'

describe('<EditorBed />', function() {

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
    isPublic: false,
    clips: [clip1, clip2]
  }

  let store
  beforeEach(() => {
    store = makeStore()
  })
  
  it('should fetch collection on load', () => {
    let mock$ = stub().returns({
      sortable: spy(),
      data: stub().returns(true)
    })
    mock$.ajax = spy()
    const matchProps = { params: { id: clipCollection1._id } }
    let wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <EditorBed $={mock$} match={matchProps}/>
        </MemoryRouter>
      </Provider>
    )
    expect(mock$.ajax.calledWithMatch({url: '/api/me/collections/' + clipCollection1._id})).to.be.true
  })

  it('should list existing clips', async () => {
    let mock$ = stub().returns({
      sortable: spy(),
      data: stub().returns(true)
    })
    mock$.ajax = spy()

    const matchProps = { params: { id: 'asdf0' } }
    let wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <EditorBed $={mock$} match={matchProps}/>
        </MemoryRouter>
      </Provider>
    )
    expect(mock$.ajax.calledOnce).to.be.true
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)

    const state = store.getState()
    expect(state.editor.collection).to.deep.equal(clipCollection1)
    
    wrapper.update()
    expect(wrapper.find('.clip-container')).to.have.lengthOf(2)
  })
  
  it("should record a new clip", async () => {
    let mock$ = stub().returns({
      sortable: spy(),
      data: stub().returns(true)
    })
    mock$.ajax = spy()
    const matchProps = { params: { id: 'asdf0' } }
    let wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <EditorBed $={mock$} match={matchProps}/>
        </MemoryRouter>          
      </Provider>
    )
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    
    wrapper.find('form input[name="vid"]').simulate('change', {target: { name: 'vid', value: 'dfjlksdjf' }})
    wrapper.find('form input[name="start"]').simulate('change', {target: { name: 'start', value: '3:00' }})
    wrapper.find('form input[name="end"]').simulate('change', {target: { name: 'end', value: '3:35' }})
    wrapper.find('form.new-clip').simulate('submit')

    expect(mock$.ajax.calledWithMatch({
      url: '/api/me/collections/asdf0/clips',
      data: {
      vid: 'dfjlksdjf',
      start: '3:00',
      end: '3:35'
      }})).to.be.true

    const clipCollection2 = {
      _id: 'asdf0',
      name: "Some collection",
      isPublic: false,
      clips: [clip1, clip2, {_id: 'adsf3', vid: 'dfjlksdjf', start: 180, duration: 35}]
    }
    await mock$.ajax.getCall(1).args[0].success(clipCollection2)
    wrapper.update()
    expect(wrapper.find('.clip-container')).to.have.lengthOf(3)
    expect(wrapper.find('.clip-container').last().text()).to.contain('dfjlksdjf')
  })

  it('should render start and end times', async() => {
    let mock$ = stub().returns({
      sortable: spy(),
      data: stub().returns(true)
    })
    mock$.ajax = spy()
    const matchProps = { params: { id: 'asdf0' } }
    let wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>        
          <EditorBed $={mock$} match={matchProps}/>
        </MemoryRouter>
      </Provider>
    )
    
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
    let mock$ = stub().returns({
      sortable: spy(),
      data: stub().returns(true)
    })
    mock$.ajax = spy()
    const matchProps = { params: { id: 'asdf0' } }
    let wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <EditorBed $={mock$} match={matchProps}/>
        </MemoryRouter>
      </Provider>
    )
    
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    wrapper.update()

    wrapper.find('.name-modification').simulate('click')
    expect(wrapper.find('.name-modification')).to.have.lengthOf(1)
    wrapper.find('.name-modification').find('input').simulate('change', {target: {name: 'collection[name]', value: 'nice poems'}})
    wrapper.find('form.name-modification').simulate('submit')

    expect(mock$.ajax.calledWithMatch({
      url: '/api/me/collections/asdf0',
      method: 'PUT',
      data: {
        name: 'nice poems'
    }})).to.be.true

    clipCollection1.name = 'nice poems'
    await mock$.ajax.getCall(1).args[0].success(clipCollection1)
    wrapper.update()
    
    expect(wrapper.find('.name-editor')).to.have.lengthOf(0)

  })

  it('should permit clip deletion', async () => {
    let mock$ = stub().returns({
      sortable: spy(),
      data: stub().returns(true)
    })
    mock$.ajax = spy()
    const matchProps = { params: { id: clipCollection1._id } }
    let wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <EditorBed $={mock$} match={matchProps}/>
        </MemoryRouter>
      </Provider>
    )
    
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    wrapper.update()

    expect(wrapper.find('.clip-container')).to.have.lengthOf(2)
    wrapper.find('.clip-container .btn-delete').first().simulate('click')

    expect(mock$.ajax.calledWithMatch({
      url: '/api/me/collections/' + clipCollection1._id + '/clips/' + clip1._id,
      method: 'DELETE',
    })).to.be.true

    await mock$.ajax.getCall(1).args[0].success(null)
    wrapper.update()
    
    expect(wrapper.find('.clip-container')).to.have.lengthOf(1)
    expect(wrapper.find('.clip-container').key()).to.equal(clip2._id)
  })

  it('should support toggling Public', async () => {
    let mock$ = stub().returns({
      sortable: spy(),
      data: stub().returns(true)
    })
    mock$.ajax = fake()
    const matchProps = { params: { id: clipCollection1._id } }
    let wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <EditorBed $={mock$} match={matchProps}/>
        </MemoryRouter>          
      </Provider>
    )
    
    await mock$.ajax.getCall(0).args[0].success(clipCollection1)
    wrapper.update()

    expect(wrapper.find('.collection-modification .is-public-toggle')).to.have.lengthOf(1)

    expect(wrapper.find('.collection-modification .is-public-toggle').props().checked).to.be.false
    wrapper.find('.collection-modification .is-public-toggle').simulate('change', {
      target: {
        name: 'collection[isPublic]',
        checked: true
      }
    })

    expect(mock$.ajax.calledWithMatch({
      method: 'PUT',
      data: {isPublic: true},
      url: '/api/me/collections/' + clipCollection1._id
    })).to.be.true

    clipCollection1.isPublic = true
    
    await mock$.ajax.getCall(1).args[0].success(clipCollection1)
    wrapper.update()

    expect(wrapper.find('.collection-modification .is-public-toggle').props().checked).to.be.true

    wrapper.find('.collection-modification .is-public-toggle').simulate('change', {
      target: {
        name: 'collection[isPublic]',
        checked: false
      }
    })

    expect(mock$.ajax.calledWithMatch({
      method: 'PUT',
      data: {isPublic: false},
      url: '/api/me/collections/' + clipCollection1._id
    })).to.be.true

    clipCollection1.isPublic = false
    
    await mock$.ajax.getCall(2).args[0].success(clipCollection1)
    wrapper.update()

    expect(wrapper.find('.collection-modification .is-public-toggle').props().checked).to.be.false
  })
})
