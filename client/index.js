
import React from 'react';
import ReactDOM from 'react-dom'
import App from './components/App.jsx'

var ytApiLoadedHook = null
var ytPlayer

function onYouTubeIframeAPIReady() {
  ytApiLoadedHook()
}

const silent = false
function dout(s) {
  if (silent) return
  console.log(s)
}

const clips = window.__bootstrap

addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<App clips={clips}/>, document.querySelector('.player-container'))
})
