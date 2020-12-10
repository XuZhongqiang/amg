'use strict';

const browserHelper = require('./browsersHelper');
const checkRequiredFiles = require('./checkRequiredFiles');
const clearConsole = require('./clearConsole');
const FileSizeReporter = require('./FileSizeReporter');
const formatWebpackMessages = require('./formatWebpackMessages');
const ignoredFiles = require('./ignoredFiles');
const openBrowser = require('./openBrowser');
const printBuildError = require('./printBuildError');
const redirectServedPathMiddleware = require('./redirectServedPathMiddleware');
const WatchMissingNodeModulesPlugin = require('./WatchMissingNodeModulesPlugin');
const WebpackDevServerUtils = require('./WebpackDevServerUtils');

module.exports = {
  ...browserHelper,
  checkRequiredFiles,
  clearConsole,
  ...FileSizeReporter,
  formatWebpackMessages,
  ignoredFiles,
  openBrowser,
  printBuildError,
  redirectServedPathMiddleware,
  WatchMissingNodeModulesPlugin,
  ...WebpackDevServerUtils,
};
