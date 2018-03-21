import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Word from './components/Word'

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
    this.Description();

    // this.setTimers();
  }

  componentWillUnmount() {
    // this.countdowns.forEach(function(countdown) {
    //   clearInterval(countdown);
    // });
  }

  async setTimers() {
    this.countdowns = [setInterval(this.Adjective, 10000)];
    await this.sleep(5000);
    this.countdowns.push(setInterval(this.Noun, 10000));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  Description = () => {
    fetch('https://us-central1-dannylonglegs-eefac.cloudfunctions.net/description',
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
          <Word word={this.state.adjective} /> <Word word={this.state.noun} />
        </p>
      </div>
    );
  }
}

export default App;
