'use strict';

const detect = require('detect-port-alt');
const isRoot = require('is-root');
const chalk = require('chalk');
const inquirer = require('inquirer');
const url = require('url');
const address = require('address');
const webpack = require('webpack');
const clearConsole = require('./clearConsole');
const getProcessForPort = require('./getProcessForPort');
const formatWebpackMessages = require('./formatWebpackMessages');

// 是否在终端
const isInteractive = process.stdout.isTTY;

async function choosePort(host, defaultPort) {
  try {
    const port = await detect(defaultPort, host);
    if (port === defaultPort) {
      return port;
    }

    const message =
      process.platform !== 'win32' && defaultPort < 1024 && !isRoot()
        ? '需要admin权限才能将本地服务运行在1024以下的端口号'
        : `端口号${defaultPort}已被占用.`;
    if (isInteractive) {
      clearConsole();
      const existingProcess = getProcessForPort(defaultPort);
      const question = {
        type: 'confirm',
        name: 'shouldChangePort',
        message:
          chalk.yellow(
            message +
              `${existingProcess ? ` 可能是:\n  ${existingProcess}` : ''}`
          ) + '\n\n需要帮你切换端口重新启动项目吗?',
        default: true,
      };
      const { shouldChangePort } = await inquirer.prompt(question);
      if (shouldChangePort) {
        return port;
      }
      return null;
    } else {
      console.log(chalk.red(message));
      return null;
    }
  } catch (err) {
    throw new Error(
      chalk.red(`${chalk.bold(host)}暂无可用端口.`) +
        '\n' +
        ('错误信息: ' + err.message || err) +
        '\n'
    );
  }
}

function prepareUrls(protocol, hostname, port, pathname = '/') {
  const formatUrl = hostname =>
    url.format({
      protocol,
      hostname,
      port,
      pathname,
    });

  const prettyPrintUrl = hostname =>
    url.format({
      protocol,
      hostname,
      port: chalk.bold(port),
      pathname,
    });

  const isUnspecifiedHost = hostname === '0.0.0.0' || hostname === '::';
  // lan: local area network
  let prettyHost, lanHostNameForConfig, lanUrlForTerminal;
  if (isUnspecifiedHost) {
    prettyHost = 'localhost';
    try {
      lanHostNameForConfig = address.ip();
      if (lanHostNameForConfig) {
        // 检查是否是私有ip
        if (
          /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
            lanHostNameForConfig
          )
        ) {
          lanUrlForTerminal = prettyPrintUrl(lanHostNameForConfig);
        } else {
          // 非私有ip
          lanHostNameForConfig = undefined;
        }
      }
    } catch (error) {
      // ignored
    }
  } else {
    prettyHost = hostname;
  }

  const localUrlForTerminal = prettyPrintUrl(prettyHost);
  const localUrlForBrowser = formatUrl(prettyHost);
  return {
    lanHostNameForConfig,
    lanUrlForTerminal,
    localUrlForTerminal,
    localUrlForBrowser,
  };
}

function printInstructions(appName, urls, useYarn) {
  console.log();
  console.log(`现在你可以在浏览器上打开页面了.`);
  console.log();

  if (urls.lanUrlForTerminal) {
    console.log(
      `  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}`
    );
    console.log(
      `  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`
    );
  } else {
    console.log(`  ${urls.localUrlForTerminal}`);
  }

  console.log();
  console.log('需要注意的是开发环境的编译是没有经过优化的.');
  console.log(
    `如果想要在生产环境打包, 你可以使用 ` +
      `${chalk.cyan(`${useYarn ? 'yarn' : 'npm run'} build`)}.`
  );
  console.log();
}

function createCompiler({ appName, config, urls, useYarn }) {
  let complier;
  try {
    complier = webpack(config);
  } catch (error) {
    console.log(chalk.red('编译失败.'));
    console.log();
    console.log(error.message || error);
    console.log();
    process.exit(1);
  }

  complier.hooks.invalid.tap('invalid', () => {
    if (isInteractive) {
      clearConsole();
    }

    console.log('编译中...');
  });

  let isFirstCompile = true;

  complier.hooks.done.tap('done', stats => {
    if (isInteractive) {
      clearConsole();
    }

    const statsData = stats.toJson({
      all: false,
      warnings: true,
      errors: true,
    });

    const messages = formatWebpackMessages(statsData);
    const isSuccessful = !messages.errors.length && !messages.warnings.length;
    if (isSuccessful) {
      console.log(chalk.green('编译成功!'));
    }
    if (isSuccessful && (isInteractive || isFirstCompile)) {
      printInstructions(appName, urls, useYarn);
    }
    isFirstCompile = false;

    // If errors exist, only show errors.
    if (messages.errors.length) {
      // Only keep the first error. Others are often indicative
      // of the same problem, but confuse the reader with noise.
      if (messages.errors.length > 1) {
        messages.errors.length = 1;
      }
      console.log(chalk.red('编译失败.\n'));
      console.log(messages.errors.join('\n\n'));
      return;
    }

    // Show warnings if no errors were found.
    if (messages.warnings.length) {
      console.log(chalk.yellow('编译产生了一些警告.\n'));
      console.log(messages.warnings.join('\n\n'));

      // Teach some ESLint tricks.
      console.log(
        '\n你可以搜索' +
          chalk.underline(chalk.yellow('关键词')) +
          '来了解每一个警告.'
      );
      console.log(
        '如果想要忽略这些警告, 你可以在那一行代码上面加上 ' +
          chalk.cyan('// eslint-disable-next-line') +
          '\n'
      );
    }
  });

  return complier;
}

module.exports = {
  choosePort,
  prepareUrls,
  createCompiler,
};
