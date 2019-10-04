
import { combineReducers } from 'redux'

import {
  REQUEST_NEW_COLLECTION,
  RECEIVE_NEW_COLLECTION,
  START_EDITING_COLLECTION
} from './actions.js'

/*

state = {
  clips: [{
    id: 'asdfclip1',
    clipId: 'asdfasf2',
    start: something
    end: something else
    vid: blahvid
  }],
  collections: [{
    userId: 'asdf1',
    id: 'asdf',
    name: 'My collection',
    isPublic: true
  }],
  collectionBeingEdited: 'asdf',
  collectionBeingViewed: 'asdf',
  requestingNewCollection: false,
  newCollectionId: null || 'adsf3'
}

*/

function clips(state = [], action) {
  switch(action.type) {
  default:
    return state
  }
}

function collections(state = [], action) {
  switch (action.type) {
  case RECEIVE_NEW_COLLECTION:
    return [...state, action.collection]
  default:
    return state
  }
}

function requestingNewCollection(state = false, action) {
  switch(action.type) {
  case REQUEST_NEW_COLLECTION:
    return true
  case RECEIVE_NEW_COLLECTION:
    return false
  default:
    return state
  }
}

function newCollectionId(state = null, action) {
  switch(action.type) {
  case RECEIVE_NEW_COLLECTION:
    return action.collection._id
  case START_EDITING_COLLECTION:
    return (action.id === state) ? null : state
  default:
    return state
  }
}

export const rootReducer = combineReducers({
  clips,
  collections,
  requestingNewCollection,
  newCollectionId
})
