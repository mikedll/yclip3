
import { spy, stub } from 'sinon'
import { expect } from 'chai'
import {
  receivePage,
  fetchBrowsePage
} from 'actions.js'

describe('actions', function() {
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

  let $ = spy(), dispatch = spy(), getState = stub().returns({})
  $.ajax = spy()
    
  it("fetchBrowsePage should retrieve private collections", async () => {
    let func = fetchBrowsePage($, true, 1)
    func(dispatch, getState)
    $.ajax.calledWithMatch({url:'/api/me/collections?page=1'})

    let res = {
      page: 1,
      pages: 1,
      total: 2,
      results: [col1]
    }

    await $.ajax.getCall(0).args[0].success(res)
    expect(dispatch.getCall(1).args[0]).to.deep.equal(receivePage(res, true))
  })
})
