
import React from 'react';
import { expect } from 'chai'
import { configure, mount } from 'enzyme'

import CollectionForm from 'components/CollectionForm.jsx'

describe('<CollectionForm />', () => {

  it('should present a form for making a new collection', function() {
    const wrapper = mount(<CollectionForm/>)
    // expect(wrapper.find('form')).to.have.lengthOf(1)
  })
})
