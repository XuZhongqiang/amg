'use strict';

/**
 * package.json中的browserslist字段是设置目标浏览器, 该字段会被很多工具读取.
 * 如: Autoprefixer Babel...
 */
const browserslist = require('browserslist');
const chalk = require('chalk');
const os = require('os');
const inquirer = require('inquirer');
const pkgUp = require('pkg-up');
const fs = require('fs');

const defaultBrowsers = {
  production: ['>0.2%', 'not dead', 'not op_mini all'],
  development: [
    'last 1 chrome version',
    'last 1 firefox version',
    'last 1 safari version',
  ],
};

async function shouldSetBrowsers(isInteractive) {
  if (!isInteractive) {
    return true;
  }

  const question = {
    type: 'confirm',
    name: 'shouldSetBrowsers',
    message:
      chalk.yellow('检测到你的项目中缺失browserslist配置项.') +
      `\n\n需要在${chalk.bold('package.json')}中为你添加默认配置吗?`,
    default: true,
  };

  return inquirer.prompt(question).then(answer => answer.shouldSetBrowsers);
}

async function checkBrowsers(dir, isInteractive, retry = true) {
  const config = browserslist.loadConfig({ path: dir });
  if (config) {
    return config;
  }

  if (!retry) {
    throw new Error(
      `你需要在package.json中添加${chalk.underline('browserslist')}`
    );
  }

  const shouldSet = await shouldSetBrowsers(isInteractive);
  if (!shouldSet) {
    return checkBrowsers(dir, isInteractive, false);
  }

  try {
    const filePath = pkgUp.sync({ cwd: dir });
    if (!filePath) {
      return;
    }

    const pkg = JSON.parse(fs.readFileSync(filePath));
    pkg['browserslist'] = defaultBrowsers;
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + os.EOL);

    // browserslist会在进程的生命周期里缓存它在package.json或者配置文件中读取的配置
    browserslist.clearCaches();
    console.log(`${chalk.green('已为你设置了browserslist配置项')}`);

    return checkBrowsers(dir, isInteractive, false);
  } catch (err) {
    // ignore
  }
}

module.exports = { checkBrowsers, defaultBrowsers };
