
import { expect } from 'chai'
import React from 'react';
import { configure, shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy } from 'sinon'

import AppRoot from 'components/AppRoot.jsx'

describe('<AppRoot />', () => {

  it('should redirect to collection editor on new collection creation', () => {
    let mock$ = spy()
    mock$.ajax = spy()
    let wrapper = mount(<AppRoot $={mock$}/>)
    wrapper.find('form.collection input[name=name]').simulate('change', 'My Collection')
    wrapper.find('button').simulate('click')
    mock$.ajax.getCall(0).args[0].success({id: "d3r3"})
    expect(wrapper.route.path).to.be.equal('/collections/d3r3/edit')
  })
  
})
