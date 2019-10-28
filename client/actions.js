
import AjaxAssistant from './AjaxAssistant.jsx'
import { serializeObj } from 'UrlHelper.jsx'

export const REQUEST_PAGE = 'REQUEST_PAGE'
export const RECEIVE_PAGE = 'RECEIVE_PAGE'
export const REQUEST_PAGE_ERROR = 'REQUEST_PAGE_ERROR'

export function requestPage() {
  return {
    type: REQUEST_PAGE
  }
}

export function receivePage(res) {
  return {
    type: RECEIVE_PAGE,
    res
  }
}

export function requestPageError(error) {
  return {
    type: REQUEST_PAGE_ERROR,
    error
  }
}

export function fetchBrowsePage($, path, page) {
  return (dispatch, getState) => {
    const state = getState()
    dispatch(requestPage())
    new AjaxAssistant($).get(path + '?' + serializeObj({page}))
      .then(res => {
        dispatch(receivePage(res))
      }, error => {
        dispatch(requestPageError(error))
      })
  }
}

export const REQUEST_DELETE = 'REQUEST_DELETE'
export const RECEIVE_DELETE = 'RECEIVE_DELETE'
export const REQUEST_DELETE_ERROR = 'REQUEST_DELETE_ERROR'

export const requestDelete = () => {
  return {
    type: REQUEST_DELETE,
  }
}

export const receiveDelete = (id) => {
  return {
    type: RECEIVE_DELETE,
    id
  }
}

export const requestDeleteError = (error) => {
  return {
    type: REQUEST_DELETE_ERROR,
    error
  }
}

export const browseDelete = ($, id) => {
  return (dispatch) => {
    dispatch(requestDelete())
    new AjaxAssistant($).delete('/api/me/collections/' + id)
      .then(_ => {
        dispatch(receiveDelete(id))
      }, error => {
        dispatch(requestDeleteError(error))
      })
  }
}

export const REQUEST_NEW_COLLECTION = 'REQUEST_NEW_COLLECTION'
export const RECEIVE_NEW_COLLECTION = 'RECEIVE_NEW_COLLECTION'
export const START_EDITING_COLLECTION = 'START_EDITING_COLLECTION'

export function startEditingCollection(id) {
  return {
    type: START_EDITING_COLLECTION,
    id
  }
}

export function requestNewCollection() {
  return {
    type: REQUEST_NEW_COLLECTION
  }
}

export function receiveNewCollection(collection) {
  return {
    type: RECEIVE_NEW_COLLECTION,
    collection
  }
}

export function fetchNewCollection($) {
  return (dispatch, getState) => {
    if(getState().requestingNewCollection) return Promise.resolve()
    dispatch(requestNewCollection())
    new AjaxAssistant($).post('/api/me/collections')
      .then(collection => { dispatch(receiveNewCollection(collection)) },
            error => console.log("An error occurred"))
  }
}

export const REQUEST_COLLECTION_PLAY = 'REQUEST_COLLECTION_PLAY'

export function requestCollectionPlay(id) {
  return {
    type: REQUEST_COLLECTION_PLAY,
    id    
  }  
}

export const RECEIVED_COLLECTION_FOR_PLAY = 'RECEIVED_COLLECTION_FOR_PLAY'
export const PLAYING_ERROR = 'PLAYING_ERROR'

function playingError(error) {
  return {
    type: PLAYING_ERROR,
    error
  }
}

function receiveCollectionForPlay(collection) {
  return {
    type: RECEIVED_COLLECTION_FOR_PLAY,
    collection
  }
}

export function fetchCollectionToPlay($, id) {
  return (dispatch, getState) => {

    // Could do a cache check here, to see if we already have the
    // collection.
    
    if(getState().collectionPlayRequested) return Promise.resolve()
    dispatch(requestCollectionPlay(id))
    new AjaxAssistant($).get('/api/collections/' + id)
      .then(collection => { dispatch(receiveCollectionForPlay(collection)) },
            error => {
              dispatch(playingError(error))
              console.log("An error occurred while fetching a collecdtion")
            })
  }
}

export const GOTO_NEXT_CLIP = 'GOTO_NEXT_CLIP'

export function gotoNextClip() {
  return {
    type: GOTO_NEXT_CLIP
  }
}

export const ClipCheckState = {
  PENDING: 'PENDING',
  DUE: 'DUE'
}

export const NOT_SEEKING = 'NOT_SEEKING'
export const notSeeking = () => ({
  type: NOT_SEEKING
})

export const CLIP_CHECK_PENDING = 'CLIP_CHECK_PENDING'
export const CLIP_CHECK_DUE = 'CLIP_CHECK_DUE' // pickup in componentDidUpdate
export const SHUTDOWN_PLAYER = 'SHUTDOWN_PLAYER'
export const JUMP_TO_CLIP_FOR_PLAY = 'JUMP_TO_CLIP_FOR_PLAY'
export const YT_LOADED = 'YT_LOADED'

export const jumpToForPlay = (index) => {
  return {
    type: JUMP_TO_CLIP_FOR_PLAY,
    index
  }
}

export const shutdownPlayer = () => ({
  type: SHUTDOWN_PLAYER
})

function clipCheckDue() {
  return {
    type: CLIP_CHECK_DUE
  }
}

const markClipCheckPending = () => {
  return {
    type: CLIP_CHECK_PENDING
  }
}

export const curClip = (playing) => {
  if(playing.clipIndex === null) return null;

  if(playing.clipIndex < playing.collection.clips.length) {
    const clip = playing.collection.clips[playing.clipIndex]
    
    return {
      vid: clip.vid,
      start: clip.start,
      end: (clip.start + clip.duration)
    }
  }
  return null
}

/*
 * Keeps scheduling calls to itself once called until the current clip
 * is done (pos within epsilon of ending).
 */
export function nextClipOrMonitor(vid, currentTime) {
  return (dispatch, getState) => {

    const state = getState()
    const c = curClip(state.playing)

    if(!c) {
      dout("error: requested timeout without a clip in bounds.")
      return Promise.resolve()
    }

    if (vid !== c.vid) {
      // wrong video. this timeout probably should have been
      // cleared.
      dout("critical error: video_id mismatch in nextClip. clear this timeout?")
      return Promise.resolve()
    }
    

    // clip is over?
    if (currentTime >= c.end) {
      dispatch(gotoNextClip())
      return Promise.resolve() // why are we using promises here again...?
    }

    // schedule a timeout to try again at next closest time to end.
    const timeUntilClipEnds = (c.end - currentTime) * 1000
    const waitForClipPromise = new Promise((resolve, reject) => {
      dispatch(markClipCheckPending())
      // todo: Have to start capturing the return values
      // to prevent users from causing infinite
      // timeouts by repetitively clicking the play clips button.
      setTimeout(() => resolve(), timeUntilClipEnds)
    })
    waitForClipPromise.then(() => {
      dispatch(clipCheckDue())
    })

    return waitForClipPromise
  }
}

export const SEEKING_TO_CLIP = 'SEEKING_TO_CLIP'

export const seekingToClip = () => {
  return {
    type: SEEKING_TO_CLIP
  }
}

export const REQUEST_ADD_CLIP = 'REQUEST_ADD_CLIP'
export const FINISH_ADD_CLIP = 'FINISH_ADD_CLIP'
export const ADD_CLIP_ERROR = 'REQUEST_ADD_CLIP_ERROR'

export const requestAddClip = () => {
  return {
    type: REQUEST_ADD_CLIP
  }
}

export const finishAddClip = (res) => {
  return {
    type: FINISH_ADD_CLIP,
    res
  }
}

export const addClipError = (error) => {
  return {
    type: ADD_CLIP_ERROR,
    error
  }
}

export const addClip = ($, id, data) => {
  return dispatch => {
    dispatch(requestAddClip())

    new AjaxAssistant($).post(`/api/me/collections/${id}/clips`, {
        vid: data.vid,
        start: data.start,
        end: data.end
      })
      .then(res => {
        dispatch(finishAddClip(res))
        
        this.setState(prevState => {
        })
      })
      .catch(error => {
        this.setState({error})
      })
    
  }
}
