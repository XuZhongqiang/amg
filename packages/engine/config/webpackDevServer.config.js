'use strict';

const paths = require('./paths');
const { ignoredFiles } = require('../utils');

const host = process.env.HOST || '0.0.0.0';

module.exports = function createWebpackDevServerConfig(proxy, allowedHost) {
  return {
    compress: true,
    clientLogLevel: 'silent',
    contentBase: paths.appPublic,
    watchContentBase: true,
    hot: true,
    transportMode: 'ws',
    injectClient: false,
    quiet: true,
    watchOptions: {
      ignored: ignoredFiles(paths.appSrc),
    },
    host,
    historyApiFallback: {
      disableDotRule: true,
      index: '/',
    },
    public: allowedHost,
  };
};
