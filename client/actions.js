
import AjaxAssistant from './AjaxAssistant.jsx'

export const REQUEST_NEW_COLLECTION = 'REQUEST_NEW_COLLECTION'
export const RECEIVE_NEW_COLLECTION = 'RECEIVE_NEW_COLLECTION'

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
  return dispatch => {
    dispatch(requestNewCollection())
    new AjaxAssistant($).post('/api/me/collections')
      .then(collection => receiveNewCollection(collection),
            error => console.log("An error occurred"))
  }
}
