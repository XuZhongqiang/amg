'use strict';

const fs = require('fs');
const glob = require('glob');
const path = require('path');
const webpack = require('webpack');
const postcssNormalize = require('postcss-normalize');
const TerserPlugin = require('terser-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const theme = require('./antd.theme.config');
const paths = require('./paths');
const appPackageJson = require(paths.appPackageJson);
const cssRegex = /\.css$/;
const lessRegex = /\.less$/;

const getStyleLoaders = (cssOptions, preProcessor) => {
  const loaders = [
    MiniCssExtractPlugin.loader,
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        postcssOptions: {
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
            postcssNormalize(),
          ],
        },
        // sourceMap: true,
      },
    },
  ].filter(Boolean);
  if (preProcessor) {
    const { target } = fs.existsSync(paths.appConfig)
      ? require(paths.appConfig)
      : {};
    loaders.push({
      loader: require.resolve(preProcessor),
      options: {
        // sourceMap: true,
        lessOptions: {
          javascriptEnabled: true,
          modifyVars: target === 'pc' ? theme : undefined,
        },
      },
    });
  }
  return loaders;
};

module.exports = {
  mode: 'production',
  bail: true,
  // devtool: 'source-map',
  entry: paths.appSrc,
  output: {
    path: paths.appBuild,
    filename: 'static/js/[name].[contenthash:8].js',
    futureEmitAssets: true,
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
    jsonpFunction: `webpackJsonp${appPackageJson.name}`,
    globalObject: 'this',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            ascii_only: true,
          },
        },
        // sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: {
            inline: false,
            annotation: true,
          },
        },
        cssProcessorPluginOptions: {
          preset: ['default', { minifyFontValues: { removeQuotes: false } }],
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 30000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: module => {
            let packageName = '';
            const packageScopeName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];

            if (packageScopeName.includes('@')) {
              const packageSubName = module.context.match(
                /[\\/]node_modules[\\/](.*?)[\\/](.*?)([\\/]|$)/
              )[2];
              packageName = `${packageScopeName}-${packageSubName}`;
            } else {
              packageName = packageScopeName;
            }

            return `npm.${packageName.replace('@', '')}`;
          },
          chunks: 'all',
        },
      },
    },
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`,
    },
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
              presets: [require.resolve('@wxfe/babel-preset-amg')],
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
                [require.resolve('@wxfe/babel-preset-amg'), { helpers: true }],
              ],
              cacheDirectory: true,
              cacheCompression: false,
              // sourceMaps: true,
              // inputSourceMap: true,
            },
          },
          {
            test: cssRegex,
            use: getStyleLoaders({
              importLoaders: 1,
              // sourceMap: true,
            }),
            sideEffects: true,
          },
          {
            test: lessRegex,
            use: getStyleLoaders(
              {
                importLoaders: 3,
                // sourceMap: true,
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
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // 擦除无用的css
    new PurgecssPlugin({
      paths: glob.sync(path.resolve(paths.appSrc, '**/*'), { nodir: true }),
    }),
    // new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('production')})
  ],
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
  performance: false,
};
