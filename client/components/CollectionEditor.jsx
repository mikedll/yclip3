import update from 'immutability-helper';
import React, { Component } from 'react'
import underscore from 'underscore'
import AjaxAssistant from 'AjaxAssistant.jsx'
import { FilePond } from 'react-filepond'
import "filepond/dist/filepond.min.css";

export default class CollectionEditor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      vid: "",
      start: "",
      end: "",
      error: "",
      editingName: false,
      thumbnail: null,
      thumbnailPrompt: false
    }

    if(this.props.collection) {
      this.state.collection = props.collection
    }

    this.tbodyEl = null

    this.onNewClipSubmit = this.onNewClipSubmit.bind(this)
    this.onCollectionChange = this.onCollectionChange.bind(this)
    this.onNameSubmit = this.onNameSubmit.bind(this)
    this.onNameClick = this.onNameClick.bind(this)
    this.onNameEditCancel = this.onNameEditCancel.bind(this)
    this.onDelete = this.onDelete.bind(this)
    this.onReplaceThumbnail = this.onReplaceThumbnail(this)
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
  
  componentDidUpdate(prevProps, prevState) {
    // sometimes we mount the component despite not having its data yet. so we can't do this
    // in componentDidMount.
    const $this = this
    if(this.tbodyEl && !this.props.$(this.tbodyEl).data('uiSortable')) {
      this.props.$(this.tbodyEl).sortable({
        stop: function(e, ui) {
          $this.sortChanged(e, ui)
        }
      })
    }

    if(this.state.collection && this.state.collection._id !== this.props.match.params.id) {
      // wrong collection loaded
      this.setState({error: "", vid: "", start: "", duration: ""})
      this.fetchCollection()
    } else if (prevState.collection && prevState.collection.isPublic !== this.state.collection.isPublic) {
      // isPublic toggled
      new AjaxAssistant(this.props.$).put('/api/me/collections/' + this.state.collection._id, underscore.pick(this.state.collection, 'isPublic'))
        .then(collection => this.setState({collection}))
        .catch(error => this.setState({error}))
    }
  }
  
  componentWillUnmount() {
    if(this.tbodyEl) {
      this.props.$(this.tbodyEl).sortable('destroy')
    }
  }

  onCollectionChange(e) {
    const target = e.target
    const name = target.name
    const value = target.value

    if(['collection[name]', 'collection[isPublic]'].indexOf(name) !== -1) {
      let left = name.indexOf('['), right = name.indexOf(']'),
          attrName = name.slice(left + 1, right)

      let setableValue = value
      if(attrName === 'isPublic') setableValue = target.checked

      this.setState((prevState) => {
        return update(prevState, {'collection': {[attrName]: {$set: setableValue}}})
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

  thumbnailUrl() {
    return this.state.thumbnail ? ('/storage/' + this.state.thumbnail = '.png') : ''
  }

  onReplaceThumbnail() {
    this.setState(prevState => {thumbnailPrompt: !prevState.thumbnailPrompt})
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
            <input type="text" name="collection[name]" value={this.state.collection.name} onChange={this.onCollectionChange} placeholder="Collection Name" className="form-control"/>
            <button type="submit" className="btn btn-primary">Save</button>
            <button className="btn btn-danger" onClick={this.onNameEditCancel}>Cancel</button>
          </form>
        </div>
      )

      let isPublicSection = null
      if(this.state.collection) {
        let checked = {checked: false}
        if(this.state.collection.isPublic === true) {
          checked = {checked: true}
        }

        isPublicSection = (
          <div className="collection-modification">
            <input className='is-public-toggle' type="checkbox" id={'is-public-' + this.state.collection._id}
                   name="collection[isPublic]" value="isPublic" {...checked} onChange={this.onCollectionChange}/>
            <label htmlFor={'is-public-' + this.state.collection._id}>Public</label>
          </div>
        )        
      }

      let thumbnailSection = null
      if(this.state.collection) {
        if(this.thumbnailUrl() === '' || this.state.thumbnailPrompt) {
          thumbnailSection = (
            <div className='thumbnail-wrapper'>
              <img src={this.thumbnailUrl()}/>
              <a href='#' onClick={this.onReplaceThumbnail}>Replace Thumbnail</a>
            </div>            
          )
        } else {
          thumbnailSection = (
            <div className='thumbnail-pond'>
              <FilePond labelIdle='Upload'
                        files={this.state.thumbnails}
                        allowMultiple={false}
                        maxFiles={1}
                        server={`/api/me/collections/${this.state.collection._id}/thumbnail`}
                        onprocessfile={(error, file) => {
                          this.setState({thumbnail: file.serverId})
                }}
                />
              <a href='#' onClick={this.onReplaceThumbnail}>Cancel</a>
            </div>
          )
        }
      }

      
      body = (
        <div>
          {nameSection}
          {isPublicSection}
          {thumbnailSection}
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
              <input type="text" name="vid" value={this.state.vid} onChange={this.onCollectionChange} placeholder="Video ID" className="form-control"/>
            </div>
            <div className="form-group col-md-3">
              <input type="text" name="start" value={this.state.start} onChange={this.onCollectionChange} placeholder="Start (HH:MM:SS)" className="form-control"/>
            </div>
            <div className="form-group col-md-3">
              <input type="text" name="end" value={this.state.end} onChange={this.onCollectionChange} placeholder="End (HH:MM:SS)" className="form-control"/>
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

