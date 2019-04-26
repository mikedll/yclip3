
import React from 'react';
import ReactDOM from 'react-dom'
import AppRoot from './components/AppRoot.jsx'

window.ytApiLoadedHook = null // will be defined when the App component mounts.
window.ytPlayer

window.onYouTubeIframeAPIReady = function() {
  window.ytApiLoadedHook()
}  

const silent = false
window.dout = function(s) {
  if (silent) return
  console.log(s)
}

addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<AppRoot bootstrap={window.__bootstrap}/>, document.querySelector('.player-container'))
})
