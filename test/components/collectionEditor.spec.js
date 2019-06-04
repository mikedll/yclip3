
import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy } from 'sinon'

import CollectionEditor from 'components/CollectionEditor.jsx'

describe('<CollectionEditor />', function() {

  beforeEach(() => {
  })
  
  it('should fetch collection on load', () => {
    let mock$ = spy()
    mock$.ajax = spy()
    const matchProps = { params: { id: 1 } }
    let wrapper = mount(<CollectionEditor $={mock$} match={matchProps}/>)
    expect(mock$.ajax.calledWithMatch({url: '/api/collections/' + 1})).to.be.true
  })
})
