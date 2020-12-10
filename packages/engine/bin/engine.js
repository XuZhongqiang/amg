#!/usr/bin/env node
'use strict';

process.on('unhandledRejection', err => {
  throw err;
});

const spawn = require('cross-spawn');

const args = process.argv.slice(2);
const scriptIndex = args.findIndex(arg => arg === 'start' || arg === 'build');

const script = scriptIndex > -1 ? args[scriptIndex] : args[0];
const nodeArgs =
  scriptIndex > -1
    ? args.slice(0, scriptIndex).concat(args.slice(scriptIndex + 1))
    : args.concat();

if (['start', 'build'].includes(script)) {
  const result = spawn.sync(
    process.execPath,
    [require.resolve('../scripts/' + script)].concat(nodeArgs),
    { stdio: 'inherit' }
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log('进程被杀, 也许是在某处执行了`kill -9`');
    } else if (result.signal === 'SIGTERM') {
      console.log('进程被杀, 也许是在某处执行了`kill`或`killall`');
    }
    process.exit(1);
  }
  process.exit(result.status);
} else {
  console.log('暂不支持该命令' + script);
}
