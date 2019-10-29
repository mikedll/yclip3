
import { combineReducers } from 'redux'
import update from 'immutability-helper';
import underscore from 'underscore'

import {
  REQUEST_PAGE,
  RECEIVE_PAGE,
  REQUEST_PAGE_ERROR,
  REQUEST_DELETE,
  RECEIVE_DELETE,
  REQUEST_DELETE_ERROR,
  REQUEST_NEW_COLLECTION,
  RECEIVE_NEW_COLLECTION,
  START_EDITING_COLLECTION,
  REQUEST_COLLECTION_PLAY,
  RECEIVED_COLLECTION_FOR_PLAY,
  PLAYING_ERROR,
  FETCH_COLLECTION,
  FINISH_FETCH_COLLECTION,
  FETCH_COLLECTION_ERROR,
  GOTO_NEXT_CLIP,
  CLIP_CHECK_PENDING,
  CLIP_CHECK_DUE,
  SHUTDOWN_PLAYER,
  NOT_SEEKING,
  ClipCheckState,
  SEEKING_TO_CLIP,
  JUMP_TO_CLIP_FOR_PLAY,
  REQUEST_ADD_CLIP,
  FINISH_ADD_CLIP,
  ADD_CLIP_ERROR
} from './actions.js'

/*

state = {
  loggedInUser: null || {_id: 'adsf1', name: 'mike rivers'},
  newCollectionId: null || 'adsf3',
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
  editor: {
    collection: {_id: 'asdf1'},
    busy: false,
    error: ""
  },
  browser: {
    error: "",
    busy: false,
    pages: 5,
    currentPage: 2,
    count: 40,
    collections: ['asdf1', 'asdf2']
  },
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

function editor(state = {busy: false, error: "", collection: null}, action) {
  switch (action.type) {
  case FETCH_COLLECTION:
    return {...state, ...{busy: true}}
  case FINISH_FETCH_COLLECTION:
    return {...state, ...{busy: false, collection: action.res}}
  case FETCH_COLLECTION_ERROR:
    return {...state, ...{busy: false, error: action.error}}
  case REQUEST_ADD_CLIP:
    return {...state, ...{busy: true}}
  case ADD_CLIP_ERROR:
    return {...state, ...{busy: false, error: action.error}}
  case FINISH_ADD_CLIP:
    return {...state, ...{busy: false, error: "", collection: action.res}}
  default:
    return state
  }
}

function browser(state = {busy: false, error: "", pages: 0, page: -1, total: 0, collections: []}, action) {
  switch (action.type) {
  case REQUEST_DELETE:
    return {...state, ...{busy: true}}
  case RECEIVE_DELETE:
    const index = underscore.findIndex(state.collections, el => el._id === action.id)
    return update(state, {'busy': {$set: false}, 'collections': {$splice: [[index, 1]]}})
  case REQUEST_DELETE_ERROR:
    return {...state, ...{busy: false, error: action.error}}
  case REQUEST_PAGE:
    return {...state, ...{error: "", busy: true, collections: []}}
  case RECEIVE_PAGE:
    return {...state,
            ...underscore.pick(action.res, 'page', 'pages', 'total'),
            ...{busy: false, collections: action.res.results}}
  case REQUEST_PAGE_ERROR:
    return {...state, ...{busy: false, error: action.error}}
  default:
    return state
  }
}

function collections(state = [], action) {
  switch (action.type) {
  case RECEIVE_NEW_COLLECTION:
    return state // [...state, action.collection]
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

function playing(state = {
  error: "",
  collection: null,
  clipIndex: null,
  seeking: false,
  clipCheck: null,
  busy: false
}, action) {

  let next
  switch(action.type) {
  case REQUEST_COLLECTION_PLAY:
    return {...state, ...{busy: true, collection: null, clipIndex: null, clipCheck: null, seeking: false, error: ""}}
  case RECEIVED_COLLECTION_FOR_PLAY:
    return {...state, ...{busy: false, collection: action.collection}}
  case JUMP_TO_CLIP_FOR_PLAY:
    return {...state, ...{clipIndex: action.index}}
  case SHUTDOWN_PLAYER:
    return {...state, ...{clipIndex: null, clipCheckDue: null}}
  case PLAYING_ERROR:
    return {...state, ...{busy: false, error: action.error}}
  case SEEKING_TO_CLIP:
    return {...state, ...{seeking: true}}
  case NOT_SEEKING:
    return {...state, ...{ seeking: false }}
  case CLIP_CHECK_DUE:
    return {...state, ...{clipCheck: ClipCheckState.DUE} }
  case CLIP_CHECK_PENDING:
    return {...state, ...{clipCheck: ClipCheckState.PENDING} }
  case GOTO_NEXT_CLIP:
    if(state.clipIndex >= state.collection.clips.length - 1) {
      next = {clipIndex: null}
    } else {
      next = {clipIndex: state.clipIndex + 1}
    }
    return {...state, ...{clipCheck: null}, ...next}
  default:
    return state
  }
}

export const rootReducer = combineReducers({
  clips,
  collections,
  browser,
  requestingNewCollection,
  newCollectionId,
  playing  
})
