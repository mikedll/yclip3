
class App extends React.Component {

  componentDidMount() {
    const html = `
        <iframe id="ytplayer" type="text/html" width="720" height="405"
         src="https://www.youtube.com/embed/QLkSoyQDOXo"
         frameborder="0" allowfullscreen>
`
    this.el.innerHTML = html    
  }
  
  render() {
    return (<div ref={el => this.el = el}></div>)
  }
}

ReactDOM.render(<App/>, document.querySelector('.player-container'))
