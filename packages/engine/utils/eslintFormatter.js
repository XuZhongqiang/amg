'use strict';

const chalk = require('chalk');
const stripAnsi = require('strip-ansi');
// 生成适合打印到标准输出的无边界文本表字符串
const table = require('text-table');

function isError(message) {
  if (message.fatal || message.severity === 2) {
    return true;
  }
  return false;
}

function formatter(results) {
  let output = '\n';
  let hasErrors = false;
  let reportContainsErrorRuleIDs = false;

  results.forEach(result => {
    let messages = result.messages;
    if (messages.length === 0) {
      return;
    }

    messages = messages.map(message => {
      let messageType;
      if (isError(message)) {
        messageType = 'error';
        hasErrors = true;
        if (message.ruleId) {
          reportContainsErrorRuleIDs = true;
        }
      } else {
        messageType = 'warn';
      }

      let line = message.line || 0;
      if (message.column) {
        line += ':' + message.column;
      }
      let position = chalk.bold('Line ' + line + ':');
      return [
        '',
        position,
        messageType,
        message.message.replace(/\.$/, ''),
        chalk.underline(message.ruleId || ''),
      ];
    });

    // 如果有错误信息, 那么暂时只展示错误信息
    if (hasErrors) {
      messages = messages.filter(m => m[2] === 'error');
    }

    messages.forEach(m => {
      m[4] = m[2] === 'error' ? chalk.red(m[4]) : chalk.yellow(m[4]);
      m.splice(2, 1);
    });

    let outputTable = table(messages, {
      align: ['l', 'l', 'l'],
      stringLength(str) {
        // 从字符串中删除ANSI转义码
        // stripAnsi('\u001B]8;;https://github.com\u0007Click\u001B]8;;\u0007');
        // => 'Click'
        return stripAnsi(str).length;
      },
    });

    output += `${outputTable}\n\n`;
  });

  if (reportContainsErrorRuleIDs) {
    output +=
      '你可以搜索' + chalk.underline(chalk.red('关键词')) + '来了解每一个警告.';
  }

  return output;
}

module.exports = formatter;
