'use strict';

process.env.NODE_ENV = 'development';
process.env.BABEL_ENV = 'development';

process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');
const chalk = require('chalk');
// const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const {
  checkRequiredFiles,
  checkBrowsers,
  choosePort,
  clearConsole,
  createCompiler,
  openBrowser,
  prepareUrls,
} = require('../utils');

const paths = require('../config/paths');
const config = require('../config/webpack.dev.config');
const createWebpackDevServerConfig = require('../config/webpackDevServer.config');
const useYarn = fs.existsSync(paths.yarnLockFile);
// TTY: 终端
const isInteractive = process.stdout.isTTY;

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8088;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    // 检测是否设置了browserslist
    await checkBrowsers(paths.appPath, isInteractive);

    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    // 获取可用端口号
    const port = await choosePort(HOST, DEFAULT_PORT);
    const urls = prepareUrls(protocol, HOST, port);
    const appName = require(paths.appPackageJson).name;

    if (port == null) {
      return;
    }

    const complier = createCompiler({
      appName,
      config,
      devSocket: undefined,
      urls,
      useYarn,
    });
    const serverConfig = createWebpackDevServerConfig(
      null,
      urls.lanHostNameForConfig
    );
    const devServer = new WebpackDevServer(complier, serverConfig);
    devServer.listen(port, HOST, err => {
      if (err) {
        return console.log(err);
      }
      if (isInteractive) {
        clearConsole();
      }

      console.log(chalk.cyan('正在启动本地服务...\n'));
      openBrowser(urls.localUrlForBrowser);
    });

    ['SIGINT', 'SIGTERM'].forEach(function(sig) {
      process.on(sig, function() {
        devServer.close();
        process.exit();
      });
    });

    if (isInteractive || process.env.CI !== 'true') {
      // Gracefully exit when stdin ends
      process.stdin.on('end', function() {
        devServer.close();
        process.exit();
      });
      process.stdin.resume();
    }
  } catch (err) {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  }
}

start();
