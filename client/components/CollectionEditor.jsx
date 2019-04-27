import update from 'immutability-helper';
import React, { Component } from 'react'

export default class CollectionEditor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      vid: "",
      start: null,
      duration: null,
      error: ""
    }

    if(this.props.collection) {
      this.state = {...this.state, ...{collection: props.collection}}
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  componentDidMount() {
    if(!this.props.collection) {
      this.props.$.ajax({
        url: '/api/collections/' + this.props.match.params.id,
        success: (data) => {
          this.setState(prevState => {
            return { ...prevState, ...{ collection: { name: data.name, clips: data.clips } } }
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
      data: {
        vid: this.state.vid,
        start: this.state.start,
        duration: this.state.duration
      },
      beforeSend: (xhr) => { xhr.setRequestHeader('CSRF-Token', this.props.$('meta[name=csrf-token]').attr('content')) },
      success: (data) => {
        this.setState(prevState => {          
          return { ...update(prevState, {collection: {clips: {$push: [data]}}}), ...{ vid: "", start: null, duration: null} }
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
  
  render() {
    const error = this.state.error !== "" ? (
      <div className="alert alert-danger">
        Error: {this.state.error}
      </div>
    ): ""

    var body = null
    if(this.state.collection) {
      const clips = this.state.collection.clips.map((c) => {
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
      body = (
        <div>
          Collection:
          <strong>
            {this.props.state.name}
          </strong>

          {clips}
        </div>
      )
    }

    return (
      <div>
        {error}

        {body}
        
        <form onSubmit={this.onSubmit}>
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

