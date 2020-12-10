'use strict';
const readPkg = require('read-pkg');
const path = require('path');

module.exports = function() {
  const env = process.env.BABEL_ENV || process.env.NODE_ENV;
  const isEnvDevelopment = env === 'development';
  const isEnvProduction = env === 'production';

  if (!isEnvDevelopment && !isEnvProduction) {
    throw new Error(
      'Using `babel-preset-react-app` requires that you specify `NODE_ENV` or ' +
        '`BABEL_ENV` environment constiables. Valid values are "development", ' +
        '"test", and "production". Instead, received: ' +
        JSON.stringify(env) +
        '.'
    );
  }

  const pkg = readPkg.sync(process.cwd());
  // 如果依赖中有antd，则进行按需加载
  const dependencies = pkg.dependencies || {};
  const devDependencies = pkg.devDependencies || {};
  const depsIncludeAntd =
    Object.keys(dependencies).includes('antd') ||
    Object.keys(devDependencies).includes('antd');

  return {
    sourceType: 'unambiguous',

    presets: [
      [
        require('@babel/preset-env').default,
        {
          useBuiltIns: 'entry',
          corejs: 3,
          modules: false,
          exclude: ['transform-typeof-symbol'],
        },
      ],
      [
        require('@babel/preset-react').default,
        {
          development: true,
          useBuiltIns: true,
        },
      ],
    ],

    plugins: [
      // stage2
      [
        require('@babel/plugin-proposal-decorators').default,
        {
          legacy: true,
        },
      ],
      require('@babel/plugin-proposal-function-sent').default,
      require('@babel/plugin-proposal-export-namespace-from').default,
      require('@babel/plugin-proposal-numeric-separator').default,
      require('@babel/plugin-proposal-throw-expressions').default,

      // stage3
      require('@babel/plugin-syntax-dynamic-import').default,
      require('@babel/plugin-syntax-import-meta').default,
      [
        require('@babel/plugin-proposal-class-properties').default,
        {
          loose: true,
        },
      ],
      require('@babel/plugin-proposal-json-strings').default,
      require('@babel/plugin-proposal-object-rest-spread').default,
      require('@babel/plugin-syntax-function-bind').default,

      [
        require('@babel/plugin-transform-runtime').default,
        {
          corejs: false,
          helpers: true,
          version: require('@babel/runtime/package.json').version,
          regenerator: true,
          useESModules: true,
          absoluteRuntime: path.dirname(
            require.resolve('@babel/runtime/package.json')
          ),
        },
      ],
      require('@babel/plugin-proposal-optional-chaining').default,
      require('@babel/plugin-proposal-nullish-coalescing-operator').default,
      // 如果依赖中有antd，则进行按需加载
      depsIncludeAntd && [
        require('babel-plugin-import').default,
        {
          libraryName: 'antd',
          libraryDirectory: 'lib',
          style: true,
        },
      ],
      isEnvProduction && [
        // 打包的时候移除prop-types校验
        require('babel-plugin-transform-react-remove-prop-types').default,
        {
          removeImport: true,
        },
      ],
    ].filter(Boolean),
  };
};
