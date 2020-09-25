'use strict';

const fse = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const { execSync } = require('child_process');
const spawn = require('cross-spawn');

process.on('unhandledRejection', err => {
  throw err;
});

// 检测项目是否有git根目录
function isInGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function tryGitInit() {
  try {
    // stdio: 'ignore' 忽略子进程的fd
    execSync('git --version', { stdio: 'ignore' });
    if (isInGitRepository()) {
      return false;
    }

    execSync('git init', { stdio: 'ignore' });
    return true;
  } catch (e) {
    console.warn('Git repo 初始化失败', e);
    return false;
  }
}

function tryGitCommit(appPath) {
  try {
    execSync('git add -A', { stdio: 'ignore' });
    execSync('git commit -m "使用Amg创建项目"', {
      stdio: 'ignore',
    });
    return true;
  } catch (e) {
    /**
     * 如果用户没有配置author, 那么我们将无法提交commit.
     * 所以这时候我们会将.git文件删除, 避免git add commit 流程进行到一半
     */
    console.warn('Git commit 失败', e);
    console.warn("移除'.git'文件夹...");
    try {
      // .git是文件夹, unlinkSync()对文件夹不生效
      fse.removeSync(path.join(appPath, '.git'));
    } catch (removeErr) {
      // Ignore.
    }
    return false;
  }
}

function init(
  appPath,
  appName,
  verbose,
  templateName = 'mobile',
  originalDirectory
) {
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

  const templatePackage = templateJson.package || {};

  // templatePackage中的以下字段不作处理
  const templatePackageBlacklist = [
    'name',
    'version',
    'description',
    'keywords',
    'bugs',
    'license',
    'author',
    'contributors',
    'files',
    'browser',
    'bin',
    'man',
    'directories',
    'repository',
    'peerDependencies',
    'bundledDependencies',
    'optionalDependencies',
    'engineStrict',
    'os',
    'cpu',
    'preferGlobal',
    'private',
    'publishConfig',
  ];

  // templatePackage中的以下字段需要合并
  const templatePackageToMerge = ['dependencies', 'scripts'];

  const templatePackageToReplace = Object.keys(templatePackage).filter(
    key =>
      !templatePackageBlacklist.includes(key) &&
      !templatePackageToMerge.includes(key)
  );

  appPackage.dependencies = appPackage.dependencies || {};
  appPackage.devDependencies = appPackage.devDependencies || {};

  const templateScripts = templatePackage.scripts || {};

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
  // TODO: browserslist抽离到utils
  appPackage.browserslist = {
    production: ['>0.2%', 'not dead', 'not op_mini all'],
    development: [
      'last 1 chrome version',
      'last 1 firefox version',
      'last 1 safari version',
    ],
  };

  // 添加在template中设置的额外的key
  templatePackageToReplace.forEach(key => {
    appPackage[key] = templatePackageToReplace[key];
  });

  fse.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(appPackage, null, 2) + os.EOL
  );

  const readmeExists = fse.existsSync(path.join(appPath, 'README.md'));
  if (readmeExists) {
    fse.renameSync(
      path.join(appPath, 'README.md'),
      path.join(appPath, 'README.old.md')
    );
  }

  const templateDir = path.join(templatePath, 'template');
  if (!fse.existsSync(templateDir)) {
    console.error(`无法在此路径找到template: ${chalk.green(templateDir)}`);
    return;
  }
  fse.copySync(templateDir, appPath);

  if (useYarn) {
    try {
      const readme = fse.readFileSync(path.join(appPath, 'README.md'), 'utf8');
      fse.writeFileSync(
        path.join(appPath, 'README.md'),
        readme.replace(/(npm run |npm )/g, 'yarn '),
        'utf8'
      );
    } catch (error) {
      // 仅仅捕捉错误, 默认不作处理
    }
  }

  // 如果本地文件夹已存在.gitignore文件, 则合并, 如果不存在, 那么重命名gitignore
  const gitignoreExists = fse.existsSync(path.join(appPath, '.gitignore'));
  if (gitignoreExists) {
    const data = fse.readFileSync(path.join(appPath, 'gitignore'));
    fse.appendFileSync(path.join(appPath, '.gitignore'), data);
    // 删除gitignore文件
    fse.unlinkSync(path.join(appPath, 'gitignore'));
  } else {
    // 这里用moveSync来重命名文件, 是因为某些版本下的node fs.rename这个api会把gitignore文件名错误的重命名为.npmignore
    fse.moveSync(
      path.join(appPath, 'gitignore'),
      path.join(appPath, '.gitignore')
    );
  }

  let initializedGit = false;
  if (tryGitInit()) {
    initializedGit = true;
    console.log();
    console.log('初始化 git repository.');
  }

  let command;
  let remove;
  let args;

  if (useYarn) {
    command = 'yarnpkg';
    remove = 'remove';
    args = ['add'];
  } else {
    command = 'npm';
    remove = 'uninstall';
    args = ['install', verbose && '--verbose'].filter(arg => arg);
  }

  const dependenciesToInstallInTemplate = templatePackage.dependencies || {};
  const devDependenciesToInstallInTemplate =
    templatePackage.devDependencies || {};

  if (templateName && Object.keys(dependenciesToInstallInTemplate).length) {
    const dependenciesWithVersionInTemplate = Object.entries(
      dependenciesToInstallInTemplate
    ).map(([dependency, version]) => `${dependency}@${version}`);
    console.log();
    console.log('正在安装模板中的dependencies...');

    const dependencyArgs = args.concat(dependenciesWithVersionInTemplate);
    const result = spawn.sync(command, dependencyArgs, { stdio: 'inherit' });
    if (result.status !== 0) {
      console.log(`\`${command} ${dependencyArgs.join(' ')}\` 执行失败`);
      return;
    }
  }

  if (templateName && Object.keys(devDependenciesToInstallInTemplate).length) {
    const devDependenciesWithVersionInTemplate = Object.entries(
      devDependenciesToInstallInTemplate
    ).map(([devDependency, version]) => `${devDependency}@${version}`);
    console.log();
    console.log('正在安装模板中的devDependencies...');

    const devDependencyArgs = args
      .concat('-D')
      .concat(devDependenciesWithVersionInTemplate);
    const result = spawn.sync(command, devDependencyArgs, { stdio: 'inherit' });
    if (result.status !== 0) {
      console.log(`\`${command} ${devDependencyArgs.join(' ')}\` 执行失败`);
      return;
    }
  }

  //TODO: 删除node_modules中的template

  if (initializedGit && tryGitCommit()) {
    console.log();
    console.log('已为你执行git commit');
  }

  let cdPath;
  // 说明用户在originalDirectory文件夹下创建项目
  console.log('originalDirectory: ', originalDirectory);
  console.log('appName: ', appName);
  console.log('appPath: ', appPath);
  if (originalDirectory && path.join(originalDirectory, appName) === appPath) {
    cdPath = appName;
  } else {
    cdPath = appPath;
  }

  const displayedCommand = useYarn ? 'yarn' : 'npm';
  console.log();
  console.log(`已为你在'${appPath}'目录下创建了'${appName}'`);
  console.log('你可以执行以下命令:');
  console.log();
  console.log(`  运行项目:${chalk.cyan(` ${displayedCommand} start`)}`);
  console.log();
  console.log(
    `  打包项目:${chalk.cyan(
      ` ${displayedCommand} ${useYarn ? '' : 'run '}build`
    )}`
  );
  console.log();
  console.log('现在你不妨试试在命令行输入: ');
  console.log(chalk.cyan('  cd'), cdPath);
  console.log(`  ${chalk.cyan(`${displayedCommand} start`)}`);
  if (readmeExists) {
    console.log();
    console.log(
      chalk.yellow('文件夹下原先有`README.md`,已被重命名为`README.old.md`')
    );
  }
  console.log();
  console.log('Happy hacking!');
}

module.exports = init;
