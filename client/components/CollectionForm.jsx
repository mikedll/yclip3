
import React from 'react';

export default class CollectionForm extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      name: ""
    }
    
    this.onSubmit = this.onSubmit.bind(this)
  }
  
  onSubmit() {
  }
  
  render() {
    return (<form onSubmit={this.onSubmit}></form>)
  }
  
}
