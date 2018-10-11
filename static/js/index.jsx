
var ytApiLoadedHook = null;

function onYouTubeIframeAPIReady() {
  ytApiLoadedHook()
}

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      player: null,
      done: false
    }

    this.onPlayerReady = this.onPlayerReady.bind(this)
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this)
  }

  onPlayerReady(e) {
    e.target.playVideo()
  }
  
  onPlayerStateChange(e) {
    if(e.data === YT.PlayerState.PLAYING && !this.done) {
      setTimeout(() => this.player.stopVideo(), 6000)
      this.setState({done: true})
    }
  }
  
  componentDidMount() {
    // bind to ytApiLoadedHook before onYouTubeIframeAPIReady tries
    // to use it.
    window.ytApiLoadedHook = () => {
      this.player = new YT.Player('embedded-player-5', {
        height: '390',
        width: '640',
        videoId: 'QLkSoyQDOXo',
        events: {
          'onReady': this.onPlayerReady,
          'onStateChange': this.onPlayerStateChange
        },
        origin: window.location.origin
      })      
    }

    let tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)    
  }
  
  render() {
    return (
      <div className="embedded-player-container">
        <div id="embedded-player-5"></div>
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.querySelector('.player-container'))
