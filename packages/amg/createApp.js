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
const os = require('os');
const execSync = require('child_process').execSync;
const spawn = require('cross-spawn');
const semver = require('semver');
const inquirer = require('inquirer');

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
  // .option('--template <path-to-template>', '为项目指定模板')
  .option('--use-npm', '使用npm初始化项目')
  .on('--help', () => {
    console.log(`    只有 ${chalk.green('<project-directory>')} 是必需的`);
    console.log();
    // TODO: 介绍模板的使用
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
        npmPackages: ['react', 'react-dom', '@wxfe/engine'],
        npmGlobalPackages: ['@wxfe/amg'],
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
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-app')}`);
  console.log();
  console.log(
    `你可以通过运行 ${chalk.cyan(`${program.name()} --help`)}  来查看所有选项`
  );
  process.exit(1);
}

createApp(projectName, program.verbose, program.useNpm);

/**
 *
 * @param {*} projectName
 * @param {*} verbose
 * @param {*} templateType eg: 'typescript'用template作为字段来选择下载哪个模板
 * @param {*} useNpm
 */
async function createApp(projectName, verbose, useNpm) {
  const root = path.resolve(projectName);
  const appName = path.basename(root);

  checkAppName(appName);
  fse.ensureDirSync(root);
  if (!isSafeToCreateProjectIn(root, projectName)) {
    process.exit(1);
  }

  const { templateType } = await inquirer.prompt([
    {
      name: 'templateType',
      type: 'list',
      message: '请选择项目模版：',
      choices: [
        { name: 'pc模板', value: 'pc' },
        { name: 'pc模板(测试/后端同学请选此选项)', value: 'pc' },
        { name: 'mobile模板', value: 'mobile' },
        // { name: '本地文件', value: 'local' },
        // { name: '从git上拉取已有模板', value: 'git' },
        { name: '取消', value: false },
      ],
    },
  ]);

  if (!templateType) {
    process.exit(1);
  }

  let templateLocalPath;
  if (templateType === 'local') {
    const result = await inquirer.prompt([
      {
        name: 'templateLocalPath',
        type: 'input',
        message:
          "请输入模板文件的本地路径(以'file:'开头, 如'file:../path/to/your/template/amg-template-local'):",
        default: '',
      },
    ]);
    templateLocalPath = result.templateLocalPath;
    if (!templateLocalPath) {
      process.exit(1);
    }
    // if (!templateLocalPath)
  }

  let templateGit;
  if (templateType === 'git') {
    const result = await inquirer.prompt([
      {
        name: 'templateGit',
        type: 'input',
        message: '请输入模板的git地址:',
        default: '',
      },
    ]);
    templateGit = result.templateGit;
    if (!templateGit) {
      process.exit(1);
    }
    if (!templateGit.includes('://')) {
      console.log(chalk.red('请输入正确的git地址'));
      process.exit(1);
    }
  }

  console.log();
  console.log(`正在为你创建新项目...`);
  console.log(`可以在目录 ${chalk.green(root)} 下查看`);
  console.log();

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
  };

  fse.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  const useYarn = useNpm ? false : shouldUseYarn();
  const originalDirectory = process.cwd();
  process.chdir(root);

  const templateConfig = { templateType, templateGit, templateLocalPath };
  run(root, appName, verbose, templateConfig, useYarn, originalDirectory);
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

function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function run(
  root,
  appName,
  verbose,
  templateConfig = {},
  useYarn,
  originalDirectory
) {
  const templateToInstall = getTemplateInstallPackage(templateConfig);
  const allDependencies = ['react', 'react-dom', templateToInstall].filter(
    Boolean
  );
  const allDevDependencies = ['@wxfe/engine'];

  console.log('正在安装依赖包, 这可能需要花费几分钟时间.');
  console.log(
    `正在安装${chalk.cyan('react')}, ${chalk.cyan('react-dom')}${
      templateToInstall ? ', ' + chalk.cyan(templateToInstall) : ''
    }`
  );

  install(root, useYarn, allDependencies, allDevDependencies, verbose, appName);

  setVersionForRuntimeDepsIn(root);

  templateConfig.templateName = templateToInstall;
  executeNodeScript(
    process.cwd(),
    [root, appName, verbose, templateConfig, originalDirectory],
    `
      const init = require('@wxfe/engine/scripts/init.js');
      init.apply(null, JSON.parse(process.argv[1]));
    `
  );
}

function getTemplateInstallPackage(templateConfig = {}) {
  const { templateType } = templateConfig;
  if (!templateType) {
    return;
  }

  let templateToInstall;
  if (templateType === 'mobile' || templateType === 'pc') {
    templateToInstall = `@wxfe/amg-template-${templateType}`;
  }

  return templateToInstall;
}

function install(
  root,
  useYarn,
  dependencies,
  devDependencies,
  verbose,
  appName
) {
  let command;
  let publicArgs;

  if (useYarn) {
    command = 'yarn';
    publicArgs = ['add', '--exact'];
  } else {
    command = 'npm';
    publicArgs = ['install', '--save', '--save-exact', '--loglevel', 'error'];
  }

  const args = publicArgs.concat(dependencies);
  const devArgs = publicArgs.concat(devDependencies).concat('-D');

  if (verbose) {
    args.push('--verbose');
    devArgs.push('--verbose');
  }

  const ret = spawn.sync(command, args, { stdio: 'inherit' });
  const devRet = spawn.sync(command, devArgs, { stdio: 'inherit' });
  if (ret.status !== 0) {
    handleCommandError(
      {
        command: `${command} ${args.join(' ')}`,
      },
      root,
      appName
    );
  }
  if (devRet.status !== 0) {
    handleCommandError(
      {
        command: `${command} ${devArgs.join(' ')}`,
      },
      root,
      appName
    );
  }
}

function handleCommandError(reason, root, appName) {
  console.log();
  console.log('项目初始化失败');
  if (reason.command) {
    console.log(`  ${chalk.cyan(reason.command)} 运行失败`);
  } else {
    console.log(chalk.red('请联系前端同学:'));
    console.log(reason);
  }
  console.log();

  deleteAlreadyGeneratedFilesIn(root, appName);
}

/**
 *
 * @param {*} path 删除已经生成的文件
 */
function deleteAlreadyGeneratedFilesIn(root, appName) {
  const knownGeneratedFiles = ['package.json', 'yarn.lock', 'node_modules'];

  const currentFiles = fse.readdirSync(root);
  currentFiles.forEach(file => {
    if (knownGeneratedFiles.includes(file)) {
      console.log(`正在删除 ${file}`);
      fse.removeSync(path.join(root, file));
    }
  });

  const remainingFiles = fse.readdirSync(root);
  if (!remainingFiles.length) {
    console.log(
      `正在删除 ${chalk.cyan(
        path.resolve(root, '..')
      )} 目录下的文件夹 ${chalk.cyan(`${appName}/`)}`
    );
    process.chdir(path.resolve(root, '..'));
    fse.removeSync(root);
  }

  console.log('删除完毕~~');
  process.exit(1);
}

function setVersionForRuntimeDepsIn(root) {
  const packagePath = path.join(root, 'package.json');
  const packageJson = require(packagePath);

  if (
    typeof packageJson.dependencies === 'undefined' ||
    typeof packageJson.devDependencies === 'undefined'
  ) {
    console.error(chalk.red('在package.json中缺少依赖项~'));
    process.exit(1);
  }

  const engineVersion = packageJson.devDependencies['@wxfe/engine'];
  if (typeof engineVersion === 'undefined') {
    console.error(chalk.red('在package.json中缺少@wxfe/engine依赖~'));
    process.exit(1);
  }

  makeCaretRange(packageJson.dependencies, 'react');
  makeCaretRange(packageJson.dependencies, 'react-dom');
  makeCaretRange(packageJson.devDependencies, '@wxfe/engine');

  fse.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + os.EOL);
}

/**
 *
 * @param {*} deps package.json的依赖项, devDependencies 或者 dependencies
 * @param {*} depName 依赖名称
 */
function makeCaretRange(deps, depName) {
  const version = deps[depName];

  if (typeof version === 'undefined') {
    console.error(chalk.red(`在package.json中缺少${depName}依赖~`));
    process.exit(1);
  }

  let patchedVersion = `^${version}`;
  if (!semver.validRange(patchedVersion)) {
    console.error(
      `无法修补${depName}的版本, 因为${patchedVersion}是个无效的版本号, 所以我们将为你设置成${version}`
    );
    patchedVersion = version;
  }

  deps[depName] = patchedVersion;
}

/**
 *
 * @param {*} cwd 子进程的当前工作目录
 * @param {*} script 需要执行的script脚本
 * @param {*} args 传给script脚本的参数
 * -e, --eval "script"
 * -- 指示 node 选项的结束。 其余的参数会被传给脚本。 如果在此之前没有提供脚本的文件名或 eval/print 脚本，则下一个参数将会被用作脚本的文件名。
 */
function executeNodeScript(cwd, args, script) {
  return spawn.sync(
    process.execPath,
    ['-e', script, '--', JSON.stringify(args)],
    { cwd, stdio: 'inherit' }
  );
}
