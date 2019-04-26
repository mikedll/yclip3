import update from 'immutability-helper';
import { Component } from 'react'

export default class CollectionEditor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      name: props.collection.name,
      clips: props.collection.clips,
      vid: "",
      start: null,
      duration: null,
      error: ""
    }

    this.onSubmit = this.onSubmit.bind(this)
  }

  componentDidMount() {
    if(!this.props.collection) {
      $.ajax({
        url: '/api/collections/' + this.match.params.id,
        success: (data) => {
          this.setState(prevState => {
            return { ...prevState, ...{ name: data.name, clips: data.clips } }
          })
        },
        error: (xhr) => {
          var text = ""
          try {
            const data = JSON.parse(xhr.responseText)
            text = data.errors
          } catch(e) {
            text = "An unknown error occurred."
          }
          this.setState(prevState => { return {...prevState, ...{error: text}} })
        }
      })
    }
  }
  
  onChange(e) {
    const target = e.target
    const name = target.name
    const value = target.value

    this.setState((prevState) => { return { ...prevState, ...{name: value} } })
  }
  
  onSubmit(e) {
    e.preventDefault()
    
    this.props.$.ajax({
      url: "/api/collections/{this.props.id}/clips",
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

    const error = this.state.error !== "" ? (
      <div className="alert alert-danger">
        Error: {this.state.error}
      </div>
    ): ""

    return (
      <div>
        {error}
        
        Collection:
        <strong>
          {this.props.state.name}
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

