'use strict';

const fse = require('fs-extra');
const path = require('path');

process.on('unhandledRejection', err => {
  throw err;
});

function init(appPath, appName, verbose, templateName) {
  const appPackage = require(path.join(appPath, 'package.json'));
  const useYarn = fse.existsSync(path.join(appPath, 'yarn.lock'));

  if (!templateName) {
    console.log();
    console.error('项目创建失败: 请指定初始化所需的模板.');
    return;
  }
}

module.exports = init;

init(
  '/Users/react/work/caocao/dml/npm包/amg/packages/amg/a',
  'a',
  true,
  'mobile'
);
