import update from 'immutability-helper';
import React, { Component } from 'react'
import underscore from 'underscore'
import AjaxAssistant from 'AjaxAssistant.jsx'

export default class CollectionEditor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      vid: "",
      start: "",
      end: "",
      error: "",
      editingName: false
    }

    if(this.props.collection) {
      this.state.collection = props.collection
    }

    this.tbodyEl = null
    this.onNewClipSubmit = this.onNewClipSubmit.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onNameSubmit = this.onNameSubmit.bind(this)
    this.onNameClick = this.onNameClick.bind(this)
    this.onNameEditCancel = this.onNameEditCancel.bind(this)
    this.onDelete = this.onDelete.bind(this)
  }

  fetchCollection() {
    new AjaxAssistant(this.props.$).get('/api/me/collections/' + this.props.match.params.id)
      .then(collection => {
        this.setState({collection})
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

  sortChanged(e, ui) {
    let idToPos = {}
    this.props.$(this.tbodyEl).find('tr').each((i, el) => {
      idToPos[this.props.$(el).data('ref-id')] = i
    })

    new AjaxAssistant(this.props.$).put('/api/me/collections/' + this.state.collection._id + '/order', idToPos)
      .then((collection) => {
        this.setState({collection})
      })
      .catch((error) => {
        this.setState({error})
      })
  }
  
  componentDidUpdate() {
    const $this = this
    if(this.tbodyEl) {
      this.props.$(this.tbodyEl).sortable({
        stop: function(e, ui) {
          $this.sortChanged(e, ui)
        }
      })
    }
  }
  
  componentWillUnmount() {
    if(this.tbodyEl) {
      this.props.$(this.tbodyEl).sortable('destroy')
    }
  }
 
  onChange(e) {
    const target = e.target
    const name = target.name
    const value = target.value

    if(name === 'collection[name]') {
      this.setState((prevState) => {
        return update(prevState, {'collection': {'name': {$set: value}}})
      })
    } else {
      this.setState({[name]: value})
    }
  }

  onNameClick(e) {
    e.preventDefault()
    this.setState({editingName: true})
  }

  onNameEditCancel(e) {
    e.preventDefault()
    this.setState({editingName: false})
  }
  
  onNameSubmit(e) {
    e.preventDefault()

    this.setState({error: ""})
    new AjaxAssistant(this.props.$).put(`/api/me/collections/${this.props.match.params.id}`, {
        name: this.state.collection.name
      })
      .then(data => {
        this.setState(prevState => {
          return { ...update(prevState, {collection: {$set: data}}), ...{ editingName: false } }
        })
      })
      .catch(error => {
        this.setState({error})
      })
    
  }
  
  onNewClipSubmit(e) {
    e.preventDefault()

    this.setState({error: ""})
    new AjaxAssistant(this.props.$).post(`/api/me/collections/${this.props.match.params.id}/clips`, {
        vid: this.state.vid,
        start: this.state.start,
        end: this.state.end
      })
      .then(data => {
        this.setState(prevState => {
          return { ...update(prevState, {collection: {$set: data}}), ...{ vid: "", start: "", end: "", error: ""} }
        })
      })
      .catch(error => {
        this.setState({error})
      })
  }

  timerFormatted(time) {
    const hours = Math.floor(time / (60 * 60))
    let remaining = time - (hours * 60 * 60)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining - (minutes * 60)
    const secondsRounded = +(Math.round(seconds + "e+3")  + "e-3")
    let ret = String(secondsRounded)

    if(ret.length < 2) {
      ret = '0' + ret
    }

    ret = minutes + ':' + ret

    if(hours > 0) {
      if(String(minutes).length < 2) {
        ret = '0' + ret
      }

      ret = hours + ':' + ret
    }

    return ret
  }

  onDelete(e, id) {
    new AjaxAssistant(this.props.$).delete('/api/me/collections/' + this.state.collection._id + '/clips/' + id)
      .then(_ => {
        const index = underscore.findIndex(this.state.collection.clips, (c) => c._id == id)
        this.setState(prevState => update(prevState, {collection: {clips: {$splice: [[index, 1]]}}}))
      })
      .catch(error => {
        this.setState(error)
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

      const nameSection = !this.state.editingName ? (
        <div className="name-container" onClick={this.onNameClick}>
          Collection: <strong>{this.state.collection.name}</strong>
        </div>
      ) : (
        <div className="name-editor">
          <form onSubmit={this.onNameSubmit}>
            <input type="text" name="collection[name]" value={this.state.collection.name} onChange={this.onChange} placeholder="Collection Name" className="form-control"/>
            <button type="submit" className="btn btn-primary">Save</button>
            <button className="btn btn-danger" onClick={this.onNameEditCancel}>Cancel</button>
          </form>
        </div>
      )

      
      body = (
        <div>
          {nameSection}

          <table className="table clips-table">
            <thead>
              <tr>
                <th>Video ID</th>
                <th>Start</th>
                <th>End</th>
                <th></th>
              </tr>
            </thead>
            <tbody ref={el => this.tbodyEl = el}>
              {this.state.collection.clips.map((c) => {
                return (
                  <tr className="clip-container" key={c._id} data-ref-id={c._id}>
                    <td>{c.vid}</td>
                    <td>{this.timerFormatted(c.start)}</td>
                    <td>{this.timerFormatted(c.start + c.duration)}</td>
                    <td><button className="btn btn-danger btn-delete" onClick={(e) => this.onDelete(e, c._id)}><i className="fas fa-trash"></i></button></td>
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
        
        <form onSubmit={this.onNewClipSubmit}>
          <div className="form-row">
            <div className="form-group col-md-4">
              <input type="text" name="vid" value={this.state.vid} onChange={this.onChange} placeholder="Video ID" className="form-control"/>
            </div>
            <div className="form-group col-md-3">
              <input type="text" name="start" value={this.state.start} onChange={this.onChange} placeholder="Start (HH:MM:SS)" className="form-control"/>
            </div>
            <div className="form-group col-md-3">
              <input type="text" name="end" value={this.state.end} onChange={this.onChange} placeholder="End (HH:MM:SS)" className="form-control"/>
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

