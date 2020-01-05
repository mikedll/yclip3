
import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { spy } from 'sinon'
import { MemoryRouter } from 'react-router-dom'
import makeStore from 'makeStore.js'
import { Provider } from 'react-redux'
import { receiveCollectionForPlay } from 'actions.js'

import PlayerBed from 'containers/PlayerBed.jsx'

describe('<PlayerBed/>', function() {

  let clip1 = {}, clip2 = {}, col1 = {
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
  
  it.only('should retrieve collection from cache', () => {

    let mock$ = spy()
    mock$.ajax = spy()
    let store = makeStore()

    store.dispatch(receiveCollectionForPlay(col3))

    const matchProps = { params: { id: col3._id } }

    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <PlayerBed $={mock$} match={matchProps}/>
        </MemoryRouter>
      </Provider>
    )

    expect(mock$.ajax.callCount).to.equal(0)
  })

})
