
import { expect } from 'chai'
import React from 'react';
import { shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy } from 'sinon'

import CollectionForm from 'components/CollectionForm.jsx'

describe('<CollectionForm />', function() {

  beforeEach(() => {
  })
  
  it('should present a form for making a new collection', () => {
    let wrapper = mount(<CollectionForm $={jQuery}/>)
    expect(wrapper.find('form')).to.have.lengthOf(1)
    expect(wrapper.find('form input[name=name]')).to.have.lengthOf(1)
  })

  it('should call server on submit', () => {
    let mock$ = spy()
    mock$.ajax = spy()
    let wrapper = mount(<CollectionForm $={mock$}/>)
    wrapper.find('form input[name=name]').simulate('change', 'My Collection')
    wrapper.find('button').simulate('click')
    expect(mock$.ajax.calledWithMatch({url: '/api/collections'})).to.be.true
  })
})
