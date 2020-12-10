'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function checkRequiredFiles(files) {
  let currentFilePath;
  try {
    files.forEach(filePath => {
      currentFilePath = filePath;
      // 测试用户对 path 指定的文件或目录的权限
      // fs.constants.F_OK: 表明文件对调用进程可见
      fs.accessSync(filePath, fs.constants.F_OK);
    });
    return true;
  } catch (error) {
    const dirName = path.dirname(currentFilePath);
    const fileName = path.basename(currentFilePath);
    console.log(
      `${chalk.red('在路径')}${chalk.cyan(dirName)}${chalk.red(
        '下未能找到以下文件:'
      )}`
    );
    console.log(`  ${chalk.cyan(fileName)}`);
    return false;
  }
}

module.exports = checkRequiredFiles;
