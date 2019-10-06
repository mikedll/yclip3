
import AjaxAssistant from './AjaxAssistant.jsx'

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
    new AjaxAssistant($).get('/api/collections')
      .then(collection => { dispatch(receiveCollectionForPlay(collection)) },
            error => console.log("An error occurred while fetching a collecdtion"))
  }
}

const GOTO_NEXT_CLIP = 'PLAYER_GOTO_NEXT_CLIP'

export function gotoNextClip() {
  return {
    type: GOTO_NEXT_CLIP
  }
}

export const ClipCheckState = {
  PENDING: 'PENDING',
  DUE: 'DUE'
}

export const NEXT_CLIP_PENDING = 'NEXT_CLIP_PENDING'
export const CLIP_CHECK_DUE = 'CLIP_CHECK_DUE' // pickup in componentDidUpdate

function clipCheckDue() {
  return {
    type: CLIP_CHECK_DUE
  }
}

/*
 CollectionViewer:
 componentDidUpdate() {
   if(this.props.clipCheck === ClipCheckState.due) {
     this.props.tryNextClip(getPlayerCurrentTime())
   }
 }

  CollectionViewerBed:
  dispatch => {
    tryNextClip: (currentTime) => {
      dispatch(calcNextClipOrReschedule(currentTime))
    }
  }
*/

export function calcNextClipOrReschedule(currentTime) {
  return (dispatch, getState) => {
    
    // check time is beyond current clip end,
    // dispatch(gotoNextClip())
    // return Promise.resolve() // why are we using promises here again...?

    // else, schedule a timeout to try again at next closest time to end.
    const timeUntilClipEnds = something
    const waitForClipPromise = new Promise((resolve, reject) => {
      dispatch(markClipCheckPending())
      setTimeout(() => resolve(), timeUntilClipEnds)
    })
    waitForClipPromise.then(() => {
      dispatch(clipCheckDue())
    })
    
    // if(getState().player && currentClipTime )
  }
}
