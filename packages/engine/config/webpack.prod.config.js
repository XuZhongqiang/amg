'use strict';

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
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
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
            // Adds PostCSS Normalize as the reset css with default options,
            // so that it honors browserslist config in package.json
            // which in turn let's users customize the target behavior as per their needs.
            postcssNormalize(),
          ],
        },
        sourceMap: true,
      },
    },
  ].filter(Boolean);
  if (preProcessor) {
    loaders.push(
      {
        loader: require.resolve('resolve-url-loader'),
        options: {
          sourceMap: true,
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
  mode: 'production',
  bail: true,
  devtool: 'source-map',
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
        sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: {
            // `inline: false` forces the sourcemap to be output into a
            // separate file
            inline: false,
            // `annotation: true` appends the sourceMappingURL to the end of
            // the css file, helping the browser find the sourcemap
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
      name: false,
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
              sourceMap: true,
            }),
            sideEffects: true,
          },
          {
            test: lessRegex,
            use: getStyleLoaders(
              {
                importLoaders: 3,
                sourceMap: true,
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
