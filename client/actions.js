
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

export function receivePage(res, isPrivate) {
  return {
    type: RECEIVE_PAGE,
    res,
    isPrivate
  }
}

export function requestPageError(error) {
  return {
    type: REQUEST_PAGE_ERROR,
    error
  }
}

export function fetchBrowsePage($, isPrivate, page) {
  return (dispatch, getState) => {
    dispatch(requestPage())
    new AjaxAssistant($).get((isPrivate ? '/api/me/collections' : '/api/collections') + '?' + serializeObj({page}))
      .then(res => {
        dispatch(receivePage(res, isPrivate))
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

export function receiveCollectionForPlay(collection) {
  return {
    type: RECEIVED_COLLECTION_FOR_PLAY,
    collection
  }
}

export function fetchCollectionToPlay($, id) {
  return (dispatch, getState) => {

    // Could do a cache check here, to see if we already have the
    // collection.
    
    dispatch(requestCollectionPlay(id))
    new AjaxAssistant($).get('/api/collections/' + id)
      .then(collection => { dispatch(receiveCollectionForPlay(collection)) },
            error => {
              dispatch(playingError(error))
              console.log("An error occurred while fetching a collecdtion")
            })
  }
}

export const FETCH_COLLECTION = 'FETCH_COLLECTION'
export const FINISH_FETCH_COLLECTION = 'FINISH_FETCH_COLLECTION'
export const FETCH_COLLECTION_ERROR = 'FETCH_COLLECTION_ERROR'

export function requestCollection() {
  return {
    type: FETCH_COLLECTION
  }
}

export function finishFetchCollection(res) {
  return {
    type: FINISH_FETCH_COLLECTION,
    res
  }
}

export function fetchCollectionError(error) {
  return {
    type: FETCH_COLLECTION_ERROR,
    error
  }
}

export const fetchCollection = ($, id, requireOwned = false) => {
  return dispatch => {
    dispatch(requestCollection())
    const path = requireOwned ? '/api/me/collections' : '/api/collections'
    new AjaxAssistant($).get(path + '/' + id)
      .then(res => { dispatch(finishFetchCollection(res)) },
            error => dispatch(fetchCollectionError(error)))
  }
}

export const REQUEST_UPDATE_COLLECTION = 'REQUEST_UPDATE_COLLECTION'
export const FINISH_UPDATE_COLLECTION = 'FINISH_UPDATE_COLLECTION'
export const UPDATE_COLLECTION_ERROR = 'UPDATE_COLLECTION_ERROR'

export function requestUpdateCollection() {
  return {
    type: REQUEST_UPDATE_COLLECTION
  }
}

export function finishUpdateCollection(res) {
  return {
    type: FINISH_UPDATE_COLLECTION,
    res
  }
}

export function updateCollectionError(error) {
  return {
    type: UPDATE_COLLECTION_ERROR,
    error
  }
}

export function updateCollection($, id, diffs) {
  return dispatch => {
    dispatch(requestUpdateCollection())
    new AjaxAssistant($).put('/api/me/collections/' + id, diffs)
      .then(res => dispatch(finishUpdateCollection(res)),
            error => dispatch(updateCollectionError(error)))
  }
}

/*

The plan is to reuse the same fetchCollection for both the player and the editor.

export const fetchCollectionForEdit = ($, id, requireOwned = true) => {
  return dispatch => {
    dispatch(fetchCollection($, id, true))
      .then(_ => dispatch(editCollectionReady(id)),
            error => dispatch(editCollectionError(error)))
  }
}
*/

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

    return new AjaxAssistant($).post(`/api/me/collections/${id}/clips`, {
      vid: data.vid,
      start: data.start,
      end: data.end
    })
    .then(res => {
      dispatch(finishAddClip(res))
    }, error => {
      dispatch(addClipError(error))
    })
  }
}

export const REQUEST_DELETE_CLIP = 'REQUEST_DELETE_CLIP'
export const FINISH_DELETE_CLIP = 'FINISH_DELETE_CLIP'
export const DELETE_CLIP_ERROR = 'DELETE_CLIP_ERROR'

export function requestDeleteClip() {
  return {
    type: REQUEST_DELETE_CLIP
  }
}

export function finishDeleteClip(id, clipId) {
  return {
    type: FINISH_DELETE_CLIP,
    id,
    clipId
  }
}

export function deleteClipError(error) {
  return {
    type: DELETE_CLIP_ERROR,
    error
  }
}

export function deleteClip($, id, clipId) {
  return dispatch => {
    dispatch(requestDeleteClip())
    new AjaxAssistant($).delete('/api/me/collections/' + id + '/clips/' + clipId)
      .then(res => dispatch(finishDeleteClip(id, clipId)),
            error => dispatch(deleteClipError(error)))
  }
}

export const REQUEST_UPDATE_CLIP_ORDER = 'REQUEST_UPDATE_CLIP_ORDER'
export const FINISH_UPDATE_CLIP_ORDER = 'FINISH_UPDATE_CLIP_ORDER'
export const UPDATE_CLIP_ORDER_ERROR = 'UPDATE_CLIP_ORDER_ERROR'

export function requestUpdateClipOrder() {
  return {
    type: REQUEST_UPDATE_CLIP_ORDER
  }
}

export function finishUpdateClipOrder(res) {
  return {
    type: FINISH_UPDATE_CLIP_ORDER,
    res
  }
}

export function updateClipOrderError(error) {
  return {
    type: UPDATE_CLIP_ORDER_ERROR,
    error
  }
}

export function updateClipOrder($, id, ordering) {
  return dispatch => {
    dispatch(requestUpdateClipOrder())
    new AjaxAssistant($).put('/api/me/collections/' + id + '/order', ordering)
      .then(res => dispatch(finishUpdateClipOrder(res)),
            error => dispatch(updateClipOrderError(error)))
  }
}
