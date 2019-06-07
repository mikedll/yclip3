
import React from 'react'
import { mount } from 'enzyme'
import { spy, stub } from 'sinon'
import { expect } from 'chai'
import { MemoryRouter } from 'react-router-dom'

import CollectionsBrowser from 'components/CollectionsBrowser.jsx'

describe('<CollectionsBrowser/>', function() {

  let clip1 = {
  }, clip2 = {
  }, col1 = {
    _id: 'asdf1',
    name: "",
    clips: []
  }, col2 = {
    _id: "adsf2",
    name: "",
    clips: []
  }
  
  it('should present clip collections on given page', async () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const wrapper = mount(
      <MemoryRouter>
        <CollectionsBrowser $={mock$}/>
      </MemoryRouter>
    )

    expect(mock$.ajax.calledWithMatch({url:'/api/collections?page=1'})).to.be.true

    await mock$.ajax.getCall(0).args[0].success({
      page: 1,
      pages: 1,
      total: 2,
      results: [col1, col2]
    })
    wrapper.update()
    expect(wrapper.find('.collection-brief')).to.have.lengthOf(2)
  })

  it("should permit deletion of a clip collection", async () => {
    let mock$ = stub().returns({data: function(ref) { return col2._id } })
    let mockW = {confirm: function() { return true } }
    mock$.ajax = spy()
    const wrapper = mount(
      <MemoryRouter>
        <CollectionsBrowser $={mock$} globalWindow={mockW}/>
      </MemoryRouter>
    )

    await mock$.ajax.getCall(0).args[0].success({
      page: 1,
      pages: 1,
      total: 2,
      results: [col1, col2]
    })
    wrapper.update()

    wrapper.find('.collection-brief a.btn-delete').last().simulate('click')

    expect(mock$.ajax.calledWithMatch({method: 'DELETE', url: '/api/collections/' + col2._id}))

    await mock$.ajax.getCall(1).args[0].success(null)
    wrapper.update()
    console.log(wrapper.html())
    expect(wrapper.find('.collection-brief')).to.have.lengthOf(1)
    expect(wrapper.find('.collection-brief').first().key()).to.equal(col1._id)
  })
})
