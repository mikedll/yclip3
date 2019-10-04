
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
