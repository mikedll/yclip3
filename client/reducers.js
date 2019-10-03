
import { combineReducers } from 'redux'

import {
} from './actions.js'

/*

state = {
  clips: [{
    id: 'asdfclip1',
    start: something
    end: something else
    vid: blahvid
  }],
  collections: [{
    id: 'asdf',
    name: 'My collection',
    clips: ['asfdclip1']
  }],
  collectionBeingEdited: 'asdf',
  collectionBeingViewed: 'asdf'
}

*/

function clips(state = [], action) {
  switch(action.type) {
  default:
    return state
  }
}

export const rootReducer = combineReducers({
  clips
})
