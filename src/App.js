import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adjective: "",
      noun: ""
    };

    this.opts = {
      headers: {
        'user-agent': 'Mozilla/4.0 MDN Example',
        'content-type': 'application/json'
      }
    }
  }

  componentDidMount() {
    //For our first load.
    this.Adjective();
    this.Noun();
  }

  Adjective = () => {
    fetch('https://us-central1-dannylonglegs-eefac.cloudfunctions.net/adjective/',
          this.opts)
      .then(response => response.json())
      .then((myJson) => {
        this.setState(myJson);
        console.log(myJson)
      });
  }

  Noun = () => {
    this.setState({ function: "florp!" });
    fetch('https://us-central1-dannylonglegs-eefac.cloudfunctions.net/noun',
          this.opts)
      .then(response => response.json())
      .then((myJson) => {
        this.setState(myJson);
      });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Daniel Poland Is A...</h1>
        </header>
        <p>
          {this.state.adjective} {this.state.noun}
        </p>
      </div>
    );
  }
}

export default App;
