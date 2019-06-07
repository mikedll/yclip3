
import { expect } from 'chai'
import React from 'react';
import { configure, shallow, mount } from 'enzyme'
import jQuery from 'jQuery'
import { spy } from 'sinon'

import AppRoot from 'components/AppRoot.jsx'

describe('<AppRoot />', () => {

  it('should render without error', () => {
    let mock$ = spy()
    let mockW = spy()
    mock$.ajax = spy()
    let wrapper = mount(<AppRoot $={mock$} globalWindow={mockW}/>)
  })
  
})
