import React, { Component } from 'react';
import { CSSTransitionGroup } from 'react-transition-group'

class Word extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }

  componentWillUnmount() {

  }

  render() {
    return (
      <CSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={300}
          transitionLeave={false}>
          <span key={this.props.word}>{this.props.word}</span>
        </CSSTransitionGroup>
    );
  }
}

export default Word;
