import React, { Component } from 'react';

export default class Index extends Component {
  render() {
    return <div className="cc-content">{this.props.children}</div>;
  }
}
