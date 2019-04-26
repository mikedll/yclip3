
import React from 'react';
import ReactDOM from 'react-dom'
import App from './components/App.jsx'

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

const clips = window.__bootstrap

addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<App clips={clips}/>, document.querySelector('.player-container'))
})
