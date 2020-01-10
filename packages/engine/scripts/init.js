'use strict';

const fse = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

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

  // TODO: 在正式发布模板前, 先暂时写死路劲吧
  // const templatePath = path.join(
  //   require.resolve(templateName, { paths: [appPath] }),
  //   '..'
  // );

  const templatePath = path.resolve(__dirname, '../../amg-template-mobile');

  const templateJsonPath = path.join(templatePath, 'template.json');

  let templateJson = {};
  if (fse.existsSync(templateJsonPath)) {
    templateJson = require(templateJsonPath);
  }

  appPackage.dependencies = appPackage.dependencies || {};
  appPackage.devDependencies = appPackage.devDependencies || {};

  const templateScripts = templateJson.scripts || {};

  // TODO: mock的命令集成进来, 命令行或者是配置文件的形式
  // 合并scripts
  appPackage.scripts = Object.assign(
    {
      start: 'engine start',
      build: 'engine build',
    },
    templateScripts
  );

  if (useYarn) {
    // 如果使用yarn, 则用yarn运行scripts命令
    appPackage.scripts = Object.entries(appPackage.scripts).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value.replace(/(npm |npm run )/, 'yarn '),
      }),
      {}
    );
  }

  // 设置eslint config
  appPackage.eslintConfig = {
    extends: '@wxfe/eslint-config-ytian',
  };

  // 设置browserslist
  appPackage.browserslist = {
    production: ['>0.2%', 'not dead', 'not op_mini all'],
    development: [
      'last 1 chrome version',
      'last 1 firefox version',
      'last 1 safari version',
    ],
  };

  fse.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(appPackage, null, 2) + os.EOL
  );

  const templateDir = path.join(templatePath, 'template');
  if (!fse.existsSync(templateDir)) {
    console.error(`无法在此路径找到template: ${chalk.green(templateDir)}`);
    return;
  }
  fse.copySync(templateDir, appPath);
}

module.exports = init;

init(
  '/Users/react/work/caocao/dml/npm包/amg/packages/amg/a',
  'a',
  true,
  'mobile'
);
