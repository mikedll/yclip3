
import { combineReducers } from 'redux'

import {
  REQUEST_NEW_COLLECTION,
  RECEIVE_NEW_COLLECTION,
  START_EDITING_COLLECTION,
  REQUEST_COLLECTION_PLAY,
  RECEIVED_COLLECTION_FOR_PLAY,
  PLAYING_ERROR,
  GOTO_NEXT_CLIP,
  CLIP_CHECK_PENDING,
  CLIP_CHECK_DUE,
  SHUTDOWN_PLAYER,
  NOT_SEEKING,
  ClipCheckState,
  SEEKING_TO_CLIP,
  JUMP_TO_CLIP_FOR_PLAY
} from './actions.js'

/*

state = {
  loggedInUser: null || {_id: 'adsf1', name: 'mike rivers'},
  clips: [{
      id: 'asdfclip1',
      clipCollection: 'asdf1',
      start: something,
      end: something else,
      vid: blahvid,
      position: 1
    },
    {
      id: 'asdfclip2',
      clipCollection: 'asdf1',
      start: something,
      end: something else,
      vid: blahvid,
      position: 2
    }
  ],
  collections: [{
    userId: 'asdf1',
    id: 'asdf',
    name: 'My collection',
    isPublic: true,
  }],
  collectionBeingEdited: 'asdf',
  collectionBeingViewed: 'asdf',
  newCollectionId: null || 'adsf3',
  collectionPlayRequested: null | 'asdf1',
  playing: null | {
    error: "",
    collection: 'adsf1',  // may hold clips
    clipIndex: 2 || null,
    seeking: false,
    clipCheck: null || ClipCheckState.pending || ClipCheckState.due
  }
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


function collectionPlayRequested(state = null, action) {
  switch(action.type) {
  case REQUEST_COLLECTION_PLAY:
    return action.id
  case RECEIVED_COLLECTION_FOR_PLAY:
    return (action.collection._id === state) ? null : state
  default:
    return state
  }
}

function playing(state = null, action) {
  let next
  switch(action.type) {
  case JUMP_TO_CLIP_FOR_PLAY:
    return {...state, ...{clipIndex: action.index}}
  case SHUTDOWN_PLAYER:
    return {...state, ...{clipIndex: null, clipCheckDue: null}}
  case PLAYING_ERROR:
    return {...state, ...{error: action.error}}
  case SEEKING_TO_CLIP:
    return {...state, ...{seeking: true}}
  case NOT_SEEKING:
    // assumes state !== null
    next = { seeking: false }
    return {...state, ...next}
  case CLIP_CHECK_PENDING:
    next = { clipCheck: ClipCheckState.PENDING }
    return (state === null) ? next : {...state, ...next }
  case GOTO_NEXT_CLIP:
    // assumes state !== null
    if(state.clipIndex >= state.collection.clips.length - 1) {
      next = {clipIndex: null}
    } else {
      next = {clipIndex: state.clipIndex + 1}
    }
    return {...state, ...next}
  default:
    return state
  }
}

export const rootReducer = combineReducers({
  clips,
  collections,
  requestingNewCollection,
  newCollectionId,
  collectionPlayRequested,
  playing
})
