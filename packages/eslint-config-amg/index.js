'use strict';

const path = require('path');
const fs = require('fs');
const restrictedGlobals = require('confusing-browser-globals');

const appSrc = path.resolve(fs.realpathSync(process.cwd()), 'src');

const config = {
  root: true,

  parser: 'babel-eslint',

  extends: [require.resolve('eslint-config-airbnb')],

  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    allowImportExportEverywhere: true,
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: ['react', 'jsx-a11y', 'import', 'react-hooks'],

  settings: {
    'import/resolver': {
      webpack: {
        config: {
          resolve: {
            alias: {
              '@': appSrc,
            },
          },
        },
      },
    },
  },

  globals: {
    window: true,
    document: true,
    XMLHttpRequest: true,
    fetch: true,
    AMap: true,
    ENV: true,
  },

  rules: {
    'max-len': ['error', { code: 120 }],
    // "no-nested-ternary": 'warn',
    'react/prefer-stateless-function': 'off', // 只有render
    'react/jsx-filename-extension': 'off', // .jsx
    'react/jsx-first-prop-new-line': 'off', // 换行
    'react/sort-comp': 'off',
    'react/jsx-closing-tag-location': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'import/extensions': 'off', // 扩展名
    'import/prefer-default-export': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    // warn
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'no-unused-expressions': 'off',
    'no-param-reassign': 'off',
    'no-mixed-operators': 'off',
    'no-shadow': 'off',
    'react/prop-types': 'off',
    'react/forbid-prop-types': 'off',
    'react/no-array-index-key': 'off',
    'react/no-string-refs': 'off',
    'jsx-a11y/anchor-has-content': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'react/destructuring-assignment': 'off',
    'newline-after-var': 1,
    'newline-before-return': 1,
    'no-restricted-globals': ['error'].concat(restrictedGlobals),
  },
};

module.exports = config;
