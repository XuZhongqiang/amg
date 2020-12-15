import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export default class Index extends Component {
  render() {
    const { children, location } = this.props;
    const ua = window.navigator.userAgent.toLowerCase();
    const ver = ua.match(/cpu iphone os (.*?) like mac os/);

    return (
      <div style={{ height: '100%' }}>
        {ver !== null && ver[1].replace(/_/g, '.').substring(0, 1) === '7' ? (
          <div className="transition-group" key={this.props.location.pathname}>
            {children}
          </div>
        ) : (
          <ReactCSSTransitionGroup
            // eslint-disable-next-line no-nested-ternary
            transitionName={
              /* isMiniProgram ? '' : */ location.action === 'POP'
                ? 'slide-right'
                : 'slide-left'
            }
            // transitionName={this.getTransitionMethod(location)}
            transitionEnterTimeout={500}
            transitionLeaveTimeout={500}
          >
            <div className="transition-group" key={location.pathname}>
              {children}
            </div>
          </ReactCSSTransitionGroup>
        )}
      </div>
    );
  }

  getTransitionMethod = location => {
    const { action } = location;
    const method = {
      vertical: {
        in: 'slide-top',
        out: 'slide-bottom',
      },
      horizontal: {
        in: 'slide-left',
        out: 'slide-right',
      },
    };

    let direction = 'horizontal';

    if (window.sessionStorage.getItem('pending') === 'vertical') {
      // 这是垂直变换之后的第一个跳转，无论如何进行删除
      window.sessionStorage.removeItem('pending');
      if (action === 'POP') {
        // 只有当是返回的时候，再次触发垂直变换
        direction = 'vertical';
      }
    }

    return method[direction][action === 'POP' ? 'out' : 'in'];
  };
}
