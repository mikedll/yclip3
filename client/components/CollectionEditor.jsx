import update from 'immutability-helper';
import { Component } from 'react'

export default class CollectionEditor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      clips: props.clips,
      vid: "",
      start: null,
      duration: null
    }

    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    const target = e.target
    const name = target.name
    const value = target.value
    
    this.setState((prevState) => update(prevState, {[name]: {$set: value}}))
  }
  
  onSubmit(e) {
    e.preventDefault()
    
    this.props.$.ajax({
      url: "/collections/{this.props.id}/clips",
      method: "POST",
      dataType: "JSON",
      success: (data) => {
        this.setState(prevState => {          
          return { ...update(prevState, {clips: {$push: [data]}}), ...{ vid: "", start: null, duration: null} }
        })
      }
    })
  }
  
  render() {
    console.log("id of collection in editor: ", this.props.match.params.id)
    const clips = this.state.clips.map((c) => {
      return (
        <div>
          vid: {c.vid}
          <br/>
          start: {c.start}
          <br/>
          duration: {c.duration}
        </div>
      )
    })

    return (
      <div>
        Collection:
        <strong>
          {this.props.name}
        </strong>

        {clips}
        
        <form>
          Video Id: <input type="text" name="vid" onChange={this.onChange}/>
          Start (seconds): <input type="text" name="start" onChange={this.onChange}/>
          Duration (seconds): <input type="text" name="duration" onChange={this.onChange}/>

          <br/>
          <button type="submit" className="btn btn-primary">Add Clip</button>
        </form>
      </div>
    )
    
  }
}

