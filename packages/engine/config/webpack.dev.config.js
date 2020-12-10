'use strict';

const webpack = require('webpack');
const postcssNormalize = require('postcss-normalize');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const EslintWebpackPlugin = require('eslint-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const { WatchMissingNodeModulesPlugin } = require('../utils');

const paths = require('./paths');
const appPackageJson = require(paths.appPackageJson);
const cssRegex = /\.css$/;
const lessRegex = /\.less$/;

const getStyleLoaders = (cssOptions, preProcessor) => {
  const loaders = [
    require.resolve('style-loader'),
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        postcssOptions: {
          ident: 'postcss',
          plugins: [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
            // Adds PostCSS Normalize as the reset css with default options,
            // so that it honors browserslist config in package.json
            // which in turn let's users customize the target behavior as per their needs.
            postcssNormalize(),
          ],
        },
        sourceMap: false,
      },
    },
  ].filter(Boolean);
  if (preProcessor) {
    loaders.push(
      {
        loader: require.resolve('resolve-url-loader'),
        options: {
          sourceMap: false,
        },
      },
      {
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: true,
        },
      }
    );
  }
  return loaders;
};

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: [
    require.resolve('../utils/webpackHotDevClient.js'),
    paths.appIndexJs,
  ].filter(Boolean),
  output: {
    path: undefined,
    filename: 'static/js/bundle.js',
    publicPath: '/',
    // TODO: 升级至webpack5后删除此选项
    // 告诉 webpack 使用未来版本的资源文件 emit 逻辑，允许在 emit 后释放资源文件的内存。这可能会破坏那些认为资源文件 emit 后仍然可读的插件。
    futureEmitAssets: true,
    chunkFilename: 'static/js/[name].chunk.js',
    jsonpFunction: `webpackJsonp${appPackageJson.name}`,
    globalObject: 'this',
  },
  resolve: {
    extensions: paths.moduleFileExtensions.map(ext => `.${ext}`),
    alias: {
      '@': paths.appSrc,
    },
  },
  module: {
    strictExportPresence: true, // 将缺失的导出提示成错误而不是警告
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        enforce: 'pre',
        use: [
          {
            options: {
              cache: true,
              formatter: require.resolve('../utils/eslintFormatter.js'),
              eslintPath: require.resolve('eslint'),
              resolvePluginsRelativeTo: __dirname,
              baseConfig: {
                extends: [require.resolve('../../eslint-config-amg')],
              },
              fix: true,
            },
            loader: require.resolve('eslint-loader'),
          },
        ],
        include: paths.appSrc,
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.(js|jsx|ts|tsx)$/,
            loader: require.resolve('babel-loader'),
            include: paths.appSrc,
            options: {
              babelrc: false,
              configFile: false,
              presets: [require.resolve('../../babel-preset-amg')],
              cacheDirectory: true,
              cacheCompression: false,
              compact: false,
            },
          },
          {
            test: /\.js$/,
            exclude: /@babel(?:\/|\\{1,2})runtime/,
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: false,
              configFile: false,
              compact: false,
              presets: [
                [require.resolve('../../babel-preset-amg'), { helpers: true }],
              ],
              cacheDirectory: true,
              cacheCompression: false,
              // Babel sourcemaps are needed for debugging into node_modules
              // code.  Without the options below, debuggers like VSCode
              // show incorrect code and set breakpoints on the wrong lines.
              sourceMaps: true,
              inputSourceMap: true,
            },
          },
          {
            test: cssRegex,
            use: getStyleLoaders({
              importLoaders: 1,
              sourceMap: false,
            }),
            sideEffects: true,
          },
          {
            test: lessRegex,
            use: getStyleLoaders(
              {
                importLoaders: 3,
                sourceMap: false,
              },
              'less-loader'
            ),
            sideEffects: true,
          },
          {
            loader: require.resolve('file-loader'),
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: paths.appHtml,
      favicon: paths.appFavicon,
      inject: true,
    }),
    // new EslintWebpackPlugin({
    //   cache: true,
    //   formatter: require.resolve('../utils/eslintFormatter.js'),
    //   eslintPath: require.resolve('eslint'),
    //   resolvePluginsRelativeTo: __dirname,
    //   baseConfig: {
    //     extends: [require.resolve('../../eslint-config-amg')]
    //   },
    //   fix: true,
    // }),
    new webpack.HotModuleReplacementPlugin(),
    new CaseSensitivePathsPlugin(), // 校验路径名大小写是否拼写正确,解决在OSX系统上大小写不敏感的问题
    new WatchMissingNodeModulesPlugin(paths.appNodeModules), // 如果开发时某个包未安装, 我们需要本地执行npm install xxx,这个插件可以让我们无需重启服务
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
  // 某些包中引入了node的模块,但并未使用,下面的配置可以让webpack给这些包提供空的mock包,这样也就不会影响代码运行了,而且可以减少无用代码的引入
  node: {
    module: 'empty',
    dgram: 'empty',
    dns: 'mock',
    fs: 'empty',
    http2: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  },
  // Turn off performance processing because we utilize
  // our own hints via the FileSizeReporter
  performance: false,
};
