
import React from 'react'
import { mount } from 'enzyme'
import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { MemoryRouter } from 'react-router-dom'
import makeStore from 'makeStore.js'
import { Provider } from 'react-redux'

import Browser from 'components/Browser.jsx'
import BrowserBed from 'containers/BrowserBed.jsx'

describe('<BrowserBed/>', function() {

  let clip1 = {
  }, clip2 = {
  }, col1 = {
    _id: 'asdf1',
    userId: 'user1',
    name: "",
    clips: []
  }, col2 = {
    _id: "adsf2",
    userId: 'user2',
    name: "",
    clips: []
  }, col3 = {
    _id: "adsf3",
    userId: 'user2',
    name: "",
    clips: []
  }
  
  it('should present private clip collections when marked as private browser', async () => {

    let mock$ = spy()
    mock$.ajax = spy()
    let store = makeStore()

    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <BrowserBed $={mock$} user={{_id: 'user1'}} browsePrivate={true}/>
        </MemoryRouter>
      </Provider>
    )

    expect(mock$.ajax.calledWithMatch({url:'/api/me/collections?page=1'})).to.be.true

    let res = {
      page: 1,
      pages: 1,
      total: 2,
      results: [col1]
    }

    await mock$.ajax.getCall(0).args[0].success(res)

    let browser = {
      page: 1,
      pages: 1,
      total: 2,
      collections: [col1]
    }
    
    expect(store.getState().browser).to.deep.include(browser)
  })

  it('should not have edit/delete links on public collection, unless collection is an owned collection', async() => {
    let mock$ = spy()
    mock$.ajax = spy()
    let store = makeStore()
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <BrowserBed user={{_id: 'user1'}} $={mock$} browsePrivate={false}/>
        </MemoryRouter>
      </Provider>
    )
    
    await mock$.ajax.getCall(0).args[0].success({
      page: 1,
      pages: 1,
      total: 2,
      results: [col1, col2, col3]
    })
    wrapper.update()
    const ownedColHolder = wrapper.find('.collection-brief').at(0)
    expect(ownedColHolder.find('a.btn-delete')).to.have.lengthOf(1)

    const notOwnedColHolder = wrapper.find('.collection-brief').at(1)
    expect(notOwnedColHolder.find('a.btn-delete')).to.have.lengthOf(0)
  })

  it('should present public clip collections on given page', async () => {
    let mock$ = spy()
    mock$.ajax = spy()
    let store = makeStore()
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <BrowserBed $={mock$} browsePrivate={false}/>
        </MemoryRouter>
      </Provider>
    )

    expect(mock$.ajax.calledWithMatch({url:'/api/collections?page=1'})).to.be.true

    await mock$.ajax.getCall(0).args[0].success({
      page: 1,
      pages: 1,
      total: 2,
      results: [col1, col2, col3]
    })
    wrapper.update()
    expect(wrapper.find('.collection-brief')).to.have.lengthOf(3)
  })

  it("should permit deletion of a clip collection if clip is owned", async () => {
    let mock$ = stub().returns({data: function(ref) { return col2._id } })
    let mockW = {confirm: function() { return true } }
    mock$.ajax = spy()
    let store = makeStore()
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <BrowserBed $={mock$} globalWindow={mockW} user={{_id: 'user2'}} browsePrivate={false}/>
        </MemoryRouter>
      </Provider>
    )

    await mock$.ajax.getCall(0).args[0].success({
      page: 1,
      pages: 1,
      total: 2,
      results: [col1, col2, col3]
    })
    wrapper.update()

    wrapper.find('.collection-brief a.btn-delete').at(0).simulate('click')

    expect(mock$.ajax.calledWithMatch({method: 'DELETE', url: '/api/collections/' + col2._id}))

    await mock$.ajax.getCall(1).args[0].success(null)
    wrapper.update()
    expect(wrapper.find('.collection-brief')).to.have.lengthOf(2)
    expect(wrapper.find('.collection-brief').at(0).key()).to.equal(col1._id)
    expect(wrapper.find('.collection-brief').at(1).key()).to.equal(col3._id)
  })
})
