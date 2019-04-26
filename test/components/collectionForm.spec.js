
import React from 'react';
import { expect } from 'chai'
import { configure, shallow } from 'enzyme'

import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() });


import CollectionForm from 'components/CollectionForm.jsx'


describe('<CollectionForm />', function() {

  it('should present a form for making a new collection', function() {
    const wrapper = shallow(<CollectionForm/>)
    expect(wrapper.find('form')).to.have.lengthOf(1)
  })
})
