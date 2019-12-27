#!/usr/bin/env node
'use strict';

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split('.');
const major = semver[0];

if (major < 8) {
  console.error(`
    系统当前的Node版本为${currentNodeVersion}.\n
    脚手架需要Node 8或者更高版本.\n
    请更新你的Node.
  `);
  process.exit(1);
}

require('./createApp');
