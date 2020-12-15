import React from 'react';
import { render } from 'react-dom';
import { browserHistory, Router } from 'react-router';
import request from '@wxfe/venom-request';
import { Auth } from '@wxfe/venom';
import { Modal, message } from 'antd';
import routes from '@/routes';
import '@/styles/index.less';

Auth.isDev(process.env.NODE_ENV === 'development');
const showModal = (options, callback) => {
  Modal.error({ ...options, onOk: callback });
};
const showMessage = text => {
  message.error(text);
};

request.init({
  // 配置全局设置，用以覆盖默认配置，可选配置，不需要传null或者{}
  options: {
    interceptStatus: ({ status, config }) => {
      if (status === 400) {
        config.errorToast && showMessage('输入内容不合法!'); // 可配置是否弹出消息

        return true;
      }
      if (status === 556) {
        showMessage('登录失效，请重新登录!');
        if (window.parent.length > 0) {
          window.parent.location.href = '/';
        } else {
          window.location.href = '/';
        }

        return true;
      }
      if (status === 555) {
        showMessage('请求的资源不存在，请联系管理员！');

        return true;
      }
    },
  },
  showModal,
  showMessage,
});

render(
  <Router history={browserHistory} routes={routes} />,
  document.getElementById('root')
);
