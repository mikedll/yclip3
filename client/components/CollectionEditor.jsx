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
      
      body = (
        <div>
          Collection: <strong>{this.state.collection.name}</strong>

          <table className="table clips-table">
            <thead>
              <tr>
                <th>Video ID</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {this.state.collection.clips.map((c) => {
                return (
                  <tr className="clip-container" key={c._id}>
                    <td>{c.vid}</td>
                    <td>{c.start}</td>
                    <td>{c.start + c.duration}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
        </div>
      )
    }

    return (
      <div>
        {error}

        {body}
        
        <form onSubmit={this.onSubmit}>
          <div className="form-row">
            <div className="form-group col-md-4">
              <input type="text" name="vid" value={this.state.vid} onChange={this.onChange} placeholder="Video ID" className="form-control"/>
            </div>
            <div className="form-group col-md-3">
              <input type="text" name="start" value={this.state.start} onChange={this.onChange} placeholder="Start (seconds)" className="form-control"/>
            </div>
            <div className="form-group col-md-3">
              <input type="text" name="duration" value={this.state.duration} onChange={this.onChange} placeholder="Duration (seconds)" className="form-control"/>
            </div>

            <div className="col-auto">
              <button type="submit" className="btn btn-primary">Add Clip</button>
            </div>
          </div>
          
        </form>
      </div>
    )    
  }
}

