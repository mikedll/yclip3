import update from 'immutability-helper';
import React, { Component } from 'react'

import AjaxAssistant from 'AjaxAssistant.jsx'

export default class CollectionEditor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      vid: "",
      start: "",
      duration: "",
      error: ""
    }

    if(this.props.collection) {
      this.state.collection = props.collection
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  fetchCollection() {
    new AjaxAssistant(this.props.$).get('/api/collections/' + this.props.match.params.id)
      .then(data => {
        this.setState(prevState => {
          return { ...prevState, ...{ collection: { name: data.name, clips: data.clips } } }
        })
      })
      .catch(error => {
        this.setState({error})
      })    
  }
  
  componentWillReceiveProps(nextProps) {
    if(this.state.collection && this.state.collection._id !== this.props.match.params.id) {
      this.setState({error: "", vid: "", start: "", duration: ""})
      this.fetchCollection()
    }
  }
  
  componentDidMount() {
    if(!this.props.collection) {
      this.fetchCollection()
    }
  }
  
  onChange(e) {
    const target = e.target
    const name = target.name
    const value = target.value

    this.setState({[name]: value})
  }
  
  onSubmit(e) {
    e.preventDefault()

    this.setState({error: ""})
    new AjaxAssistant(this.props.$).post(`/api/collections/${this.props.match.params.id}/clips`, {
        vid: this.state.vid,
        start: this.state.start,
        duration: this.state.duration
      })
      .then(data => {
        this.setState(prevState => {
          return { ...update(prevState, {collection: {$set: data}}), ...{ vid: "", start: "", duration: "", error: ""} }
        })
      })
      .catch(error => {
        this.setState({error})
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
      const clips = this.state.collection.clips.map((c, i) => {
        return (
          <div key={i}>
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
            {this.state.collection.name}
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
          Video Id: <input type="text" name="vid" value={this.state.vid} onChange={this.onChange}/>
          Start (seconds): <input type="text" name="start" value={this.state.start} onChange={this.onChange}/>
          Duration (seconds): <input type="text" name="duration" value={this.state.duration} onChange={this.onChange}/>

          <br/>
          <button type="submit" className="btn btn-primary">Add Clip</button>
        </form>
      </div>
    )    
  }
}

