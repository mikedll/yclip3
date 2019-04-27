
import React from 'react';
import ReactDOM from 'react-dom'
import AppRoot from './components/AppRoot.jsx'

window.ytApiLoaded = false
window.ytApiLoadedHook = null // will be defined when the App component mounts.
window.ytPlayer

window.onYouTubeIframeAPIReady = function() {
  window.ytApiLoaded = true
  if(window.ytApiLoadedHook) window.ytApiLoadedHook()
}  

const silent = false
window.dout = function(s) {
  if (silent) return
  console.log(s)
}

addEventListener('DOMContentLoaded', () => {

  let tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)    
  
  ReactDOM.render(<AppRoot bootstrap={window.__bootstrap}/>, document.querySelector('.player-container'))
})
