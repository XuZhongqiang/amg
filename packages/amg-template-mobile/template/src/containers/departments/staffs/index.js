import React, { Component } from 'react';
import { connect } from 'react-redux';

const mapStateToProps = () => ({});
const mapDispatchToProps = {};

@connect(mapStateToProps, mapDispatchToProps)
class Staffs extends Component {
  render() {
    return <h1>Hello Bro!</h1>;
  }
}

export default Staffs;
