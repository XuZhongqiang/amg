'use strict';

process.env.NODE_ENV = 'production';
process.env.BABEL_ENV = 'production';

process.on('unhandledRejection', err => {
  throw err;
});

const fse = require('fs-extra');
const chalk = require('chalk');
const webpack = require('webpack');

const {
  checkRequiredFiles,
  checkBrowsers,
  formatWebpackMessages,
  measureFileSizesBeforeBuild,
  printBuildError,
  printFileSizesAfterBuild,
} = require('../utils');
const paths = require('../config/paths');

const isInteractive = process.stdout.isTTY;

if (!checkRequiredFiles([paths.appSrc, paths.appHtml])) {
  process.exit(1);
}

const config = require('../config/webpack.prod.config');

const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

async function build() {
  try {
    await checkBrowsers(paths.appPath, isInteractive);
    // 计算上一次打包的文件体积大小
    const previousFileSizes = await measureFileSizesBeforeBuild(paths.appBuild);
    // 清空build文件夹, 类似于cleanWebpackPlugin
    fse.emptyDirSync(paths.appBuild);

    console.log(chalk.green('正在为你打包...'));

    const { stats, warnings } = await runComplier();

    if (warnings.length) {
      console.log(chalk.yellow('编译产生了一些警告.\n'));
      console.log(warnings.join('\n\n'));
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
    } else {
      console.log(chalk.green('编译成功.\n'));
    }

    console.log('以下是经过gzip之后的文件体积:\n');

    printFileSizesAfterBuild(
      stats,
      previousFileSizes,
      paths.appBuild,
      WARN_AFTER_BUNDLE_GZIP_SIZE,
      WARN_AFTER_CHUNK_GZIP_SIZE
    );
    console.log();
  } catch (err) {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  }
}

// 编译
function runComplier() {
  return new Promise((resolve, reject) => {
    const compiler = webpack(config);

    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }

        let errMessage = err.message;

        // Add additional information for postcss errors
        if (Object.prototype.hasOwnProperty.call(err, 'postcssNode')) {
          errMessage +=
            '\nCompileError: Begins at CSS selector ' +
            err['postcssNode'].selector;
        }

        messages = formatWebpackMessages({
          errors: [errMessage],
          warnings: [],
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        );
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n'
          )
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }

      return resolve({
        stats,
        warnings: messages.warnings,
      });
    });
  }).catch(err => {
    console.log(chalk.red('编译失败.\n'));
    printBuildError(err);
    process.exit(1);
  });
}

build();
