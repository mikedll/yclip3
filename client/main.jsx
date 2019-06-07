
import React from 'react';
import ReactDOM from 'react-dom'
import AppRootContainer from './components/AppRootContainer.jsx'

import jQuery from 'jquery'

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
  
  ReactDOM.render(<AppRootContainer jQuery={jQuery} globalWindow={window}/>, document.querySelector('.player-container'))
})
