'use strict';

// TODO:
/**
 * 1. 模板
 * 2. 脚本版本 --script-version
 */
const chalk = require('chalk');
const commander = require('commander');
const envinfo = require('envinfo');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');
const fse = require('fs-extra');

const packageJson = require('./package.json');

let projectName;

const program = new commander.Command()
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectName = name;
  })
  .option('--verbose', '输出详细日志')
  .option('--info', '查看当前环境详细信息')
  .option('--use-npm', '使用npm初始化项目')
  .on('--help', () => {
    console.log(`    只有 ${chalk.green('<project-directory>')} 是必需的`);
    console.log();
    // TODO: 介绍模板的试用
    console.log(
      `    你还可以通过 ${chalk.cyan('--template')} 命令来指定模板创建项目`
    );
    console.log();
    console.log('    在使用过程中遇到任何问题, 欢迎联系前端团队~~');
  })
  .allowUnknownOption()
  .parse(process.argv);

if (program.info) {
  console.log(chalk.bold('\n当前环境信息:'));
  console.log(`\n  ${packageJson.name} 版本: ${packageJson.version}`);
  console.log(`  当前所在目录: ${__dirname}`);
  return envinfo
    .run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'npm', 'Yarn'],
        Browsers: ['Chrome', 'Edge', 'Internet Explorer', 'Firefox', 'Safari'],
        npmPackages: ['react', 'react-dom', 'engine'],
        npmGlobalPackages: ['amg'],
      },
      {
        duplicates: true,
        showNotFound: true,
      }
    )
    .then(console.log);
}

if (typeof projectName === 'undefined') {
  console.error('请输入项目名称:');
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
  );
  console.log();
  console.log('例如: ');
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-amg')}`);
  console.log();
  console.log(
    `你可以通过运行 ${chalk.cyan(`${program.name()} --help`)}  来查看所有选项`
  );
  process.exit(1);
}

createApp(projectName);

function createApp(projectName, verbose, template, useNpm, useTypeScript) {
  const root = path.resolve(projectName);
  const appName = path.basename(root);

  checkAppName(appName);
  fse.ensureDirSync(root);
  if (!isSafeToCreateProjectIn(root, projectName)) {
    process.exit(1);
  }
  console.log();
}

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(chalk.red(`工程名 ${appName} 不符合命名规范:`));
    [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ].forEach(err => {
      console.error(chalk.red(`  * ${err}`));
    });
    console.error(chalk.red('\n不妨换个工程名试试~~'));
    process.exit(1);
  }
}

function isSafeToCreateProjectIn(root, projectName) {
  const validFiles = [
    '.DS_Store',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.gitlab-ci.yml',
    '.hg',
    '.hgcheck',
    '.hgignore',
    '.idea',
    '.npmignore',
    '.travis.yml',
    'docs',
    'LICENSE',
    'README.md',
    'mkdocs.yml',
    'Thumbs.db',
  ];

  const errorLogFilePatterns = [
    'npm-debug.log',
    'yarn-error.log',
    'yarn-debug.log',
  ];

  const isErrorLog = file => {
    return errorLogFilePatterns.some(pattern => file.startsWith(pattern));
  };

  const conflicts = fse
    .readdirSync(root)
    .filter(file => !validFiles.includes(file))
    // IntelliJ IDEA产生的文件
    .filter(file => !/\.iml$/.test(file))
    .filter(file => !isErrorLog(file));

  if (conflicts.length > 0) {
    console.log(`检测到文件夹 ${chalk.green(projectName)} 下包含如下文件:`);
    console.log();
    for (const file of conflicts) {
      try {
        const stats = fse.lstatSync(path.join(root, file));
        if (stats.isDirectory()) {
          console.log(`  ${chalk.blue(`${file}/`)}`);
        } else {
          console.log(`  ${file}`);
        }
      } catch (error) {
        console.log(`  ${file}`);
      }
    }
    console.log();
    console.log('以上文件有可能引起冲突, 所以请换个项目名称, 或者移除它们~~');

    return false;
  }

  fse.readdirSync(root).forEach(file => {
    if (isErrorLog(file)) {
      fse.removeSync(path.join(root, file));
    }
  });

  return true;
}