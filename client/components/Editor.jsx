import update from 'immutability-helper';
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import underscore from 'underscore'
import AjaxAssistant from 'AjaxAssistant.jsx'
import { FilePond } from 'react-filepond'
import "filepond/dist/filepond.min.css";

export default class Editor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      vid: "",
      start: "",
      end: "",
      editingName: false,
      thumbnail: null,
      thumbnailPrompt: false
    }

    this.tbodyEl = null

    this.onNewClipSubmit = this.onNewClipSubmit.bind(this)
    this.onCollectionChange = this.onCollectionChange.bind(this)
    this.onNameSubmit = this.onNameSubmit.bind(this)
    this.onNameClick = this.onNameClick.bind(this)
    this.onNameEditCancel = this.onNameEditCancel.bind(this)
    this.onDelete = this.onDelete.bind(this)
    this.onReplaceThumbnail = this.onReplaceThumbnail.bind(this)
  }

  fetchCollection() {
    this.props.fetch(this.props.$, this.props.match.params.id)
  }
  
  sortChanged(e, ui) {
    let idToPos = {}
    this.props.$(this.tbodyEl).find('tr').each((i, el) => {
      idToPos[this.props.$(el).data('ref-id')] = i
    })

    this.props.updateClipOrder(this.props.$, this.props.collection._id, idToPos)
  }

  needCollection() {
    return !this.props.collection || this.props.collection._id !== this.props.match.params.id
  }

  refreshFormFromProps() {
    this.setState({vid: "", start: "", duration: "", collection: underscore.pick(this.props.collection, 'name', 'isPublic'), thumbnail: this.props.collection.thumbnail ? this.props.collection.thumbnail.name : ''})
  }

  fetchCollectionIfNeeded() {
    const needed = this.needCollection()
    if(needed) {
      if(!this.props.busy) {
        this.fetchCollection()
      }
    }

    return needed
  }

  initSortable() {
    if(this.props.collection) {
      const _this = this
      if(this.tbodyEl && !this.props.$(this.tbodyEl).data('uiSortable')) {
        this.props.$(this.tbodyEl).sortable({
          stop: function(e, ui) {
            _this.sortChanged(e, ui)
          }
        })
      }
    }    
  }

  componentDidMount() {
    this.props.startingEdit(this.props.match.params.id)

    const needed = this.fetchCollectionIfNeeded()
    if(needed) return
    
    this.refreshFormFromProps()
    this.initSortable()
  }
  
  componentDidUpdate(prevProps, prevState) {
    if(prevProps.match.params.id !== this.props.match.params.id) {
      this.props.startingEdit(this.props.match.params.id)      
    }

    const needed = this.fetchCollectionIfNeeded()
    if(needed) return

    if(this.props.collection && (!prevProps.collection || underscore.some(['name', 'isPublic'], (attr) => {
      return prevProps.collection[attr] !== this.props.collection[attr]
    }))) {
      this.refreshFormFromProps()
    }

    this.initSortable()

    if(this.state.collection && this.state.collection.isPublic !== this.props.collection.isPublic) {
      // isPublic toggled
      this.props.update(this.props.$, this.props.collection._id, {isPublic: this.state.collection.isPublic})
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

    this.props.update(this.props.$, this.props.collection._id, {name: this.state.collection.name})
    this.setState({editingName: false})
  }
  
  onNewClipSubmit(e) {
    e.preventDefault()

    this.props.addClip(this.props.$, this.props.match.params.id, {
      vid: this.state.vid,
      start: this.state.start,
      end: this.state.end
    }).then(_ => {
      this.setState({ vid: "", start: "", end: ""})
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
    this.props.deleteClip(this.props.$, this.props.collection._id, id)
  }

  thumbnailUrl() {
    if(!this.state.thumbnail && !this.props.collection.thumbnail) return ''

    const name = this.state.thumbnail
    if(this.props.globalWindow.imageBucket)
      return ('http://' + this.props.globalWindow.imageBucket + '/' + name + '.png')
    else      
      return ('/storage/' + name + '.png')
  }

  onReplaceThumbnail() {
    this.setState(prevState => {
      return { thumbnailPrompt: !prevState.thumbnailPrompt }
    })
  }
  
  render() {
    const error = this.props.error !== "" ? (
      <div className="alert alert-danger">
        Error: {this.props.error}
      </div>
    ): ""

    var body = null
    if(this.props.collection) {

      let nameSection
      if(this.state.collection) {
        nameSection = !this.state.editingName ? (
          <form className="form-inline name-modification" onClick={this.onNameClick}>
            <label htmlFor="collection-name-input form-check-label mr-2">Collection:&nbsp;</label>
            <span>{this.state.collection.name}</span>
          </form>
        ) : (
          <form className="form-inline name-modification" onSubmit={this.onNameSubmit}>
            <label htmlFor="collection-name-input form-check-label">Collection: </label>
            <input type="text" name="collection[name]" value={this.state.collection.name} onChange={this.onCollectionChange} placeholder="Collection Name" className="form-control" id="collection-name-input"/>
            <button type="submit" className="btn btn-primary">Save</button>
            <button className="btn btn-danger" onClick={this.onNameEditCancel}>Cancel</button>
          </form>
        )        
      }
      
      let isPublicSection = null
      if(this.state.collection) {
        let checked = {checked: false}
        if(this.state.collection.isPublic === true) {
          checked = {checked: true}
        }

        isPublicSection = (
          <div className="collection-modification form-check">
            <input className='is-public-toggle form-check-input' type="checkbox"
                   id={'is-public-' + this.props.collection._id}
                   name="collection[isPublic]" value="isPublic" {...checked} onChange={this.onCollectionChange}/>
            <label className="form-check-label" htmlFor={'is-public-' + this.props.collection._id}>Public</label>
          </div>
        )        
      }
      
      let thumbnailSection = null
      if(this.thumbnailUrl() === '' || this.state.thumbnailPrompt) {
        let cancelBtn = this.thumbnailUrl() === '' ? null : (<a href='#' onClick={this.onReplaceThumbnail}>Cancel</a>)
        thumbnailSection = (
          <div className="thumbnail-pond-wrapper">
            <div className='thumbnail-pond'>
              <FilePond labelIdle='Upload'
                        files={this.state.thumbnails}
                        allowMultiple={false}
                        maxFiles={1}
                        server={`/api/me/collections/${this.props.collection._id}/thumbnail`}
                        onprocessfile={(error, file) => {
                          this.setState({thumbnail: file.serverId, thumbnailPrompt: false})
                }}
                />
            </div>
            {cancelBtn}
          </div>
        )
      } else {
        let imgRendered = this.thumbnailUrl() !== '' ? (<img src={this.thumbnailUrl()}/>) : null
        thumbnailSection = (
          <div className='thumbnail-wrapper'>
            {imgRendered}
            <br/>
            <a href='#' onClick={this.onReplaceThumbnail}>Upload Thumbnail</a>
          </div>            
        )
      }
      
      body = (
        <div>
          <div className="editor-top-wrapper">
            <div>
              {nameSection}
              {isPublicSection}
            </div>
            <div>
              {thumbnailSection}
            </div>
          </div>
          
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
              {this.props.collection.clips.map((c) => {
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
        
        <form className="new-clip" onSubmit={this.onNewClipSubmit}>
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

Editor.propTypes = {
  $: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  collection: PropTypes.object,
  busy: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  fetch: PropTypes.func.isRequired,
  startingEdit: PropTypes.func.isRequired,
  deleteClip: PropTypes.func.isRequired,
  updateClipOrder: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
}
