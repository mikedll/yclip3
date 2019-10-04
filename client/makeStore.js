import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'

import { rootReducer } from 'reducers.js'

export default function makeStore() {
  return createStore( rootReducer, applyMiddleware(thunkMiddleware))
}
