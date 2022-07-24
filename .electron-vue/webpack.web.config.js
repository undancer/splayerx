'use strict';

process.env.BABEL_ENV = 'renderer';

const path = require('path');
const childProcess = require('child_process');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { dependencies, optionalDependencies } = require('../package.json');

let release = '';
try {
  const result = childProcess.spawnSync('git', [
    'describe',
    '--tag',
    '--exact-match',
    '--abbrev=0',
  ]);
  if (result.status === 0) {
    const tag = result.stdout.toString('utf8').replace(/^\s+|\s+$/g, '');
    if (tag) release = `SPlayer${tag}`;
  }
} catch (ex) {
  console.error(ex);
}

function generateHtmlWebpackPluginConfig(name) {
  return {
    chunks: [name],
    filename: `${name}.html`,
    template: path.resolve(__dirname, `../src/web.ejs`),
    minify: {
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true,
    },
    nodeModules:
      process.env.NODE_ENV !== 'production' ? path.resolve(__dirname, '../node_modules') : false,
  };
}

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
let whiteListedModules = ['vue', 'vuex', 'vue-router', 'vue-i18n', 'vue-axios', 'axios', 'configcat-js', '@sentry/browser'];

const entry = {
  login: path.join(__dirname, '../src/renderer/login.ts'),
  premium: path.join(__dirname, '../src/renderer/premium.ts'),
};
if (process.env.NODE_ENV !== 'production') {
  entry['index'] = entry['login'];
}

let webConfig = {
  mode: 'development',
  devtool: '#module-eval-source-map',
  entry,
  externals: [
    ...Object.keys(Object.assign({}, dependencies, optionalDependencies)).filter(
      d => !whiteListedModules.includes(d),
    ),
    'electron',
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter'),
          },
        },
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              appendTsSuffixTo: [/\.vue$/],
            },
          },
        ],
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            extractCSS: process.env.NODE_ENV === 'production',
            loaders: {
              i18n: 'vue-i18n-loader',
            },
          },
        },
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          { loader: 'sass-loader', options: { indentedSyntax: 1 } },
          {
            loader: 'sass-resources-loader',
            options: { resources: path.join(__dirname, '../src/renderer/css/global.scss') },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader',
          {
            loader: 'sass-resources-loader',
            options: { resources: path.join(__dirname, '../src/renderer/css/global.scss') },
          },
        ],
      },
      {
        test: /\.svg$/,
        include: [path.resolve(__dirname, '../src/renderer/assets/icon')],
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              symbolId: '[name]',
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        exclude: [path.resolve(__dirname, '../src/renderer/assets/icon')],
        use: [
          {
            loader: 'url-loader',
            query: {
              limit: 10000,
              name: 'imgs/[name].[contenthash].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'media/[name].[contenthash].[ext]',
          },
        },
      },
      {
        test: /\.(woff2?|eot|ttf|ttc|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name].[contenthash].[ext]',
          },
        },
      },
    ],
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production',
  },
  plugins: [
    new VueLoaderPlugin(),
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('login')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('premium')),
    new webpack.HotModuleReplacementPlugin(),
  ],
  output: {
    publicPath: process.env.NODE_ENV !== 'production' ? undefined : process.env.WEB_CDN,
    filename: '[name].[hash].js',
    chunkFilename: 'chunks/[contenthash].js',
    libraryTarget: 'umd',
    path: path.join(__dirname, '../dist/web'),
    globalObject: 'this',
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, '../src/renderer'),
      vue$: 'vue/dist/vue.esm.js',
      '@main': path.join(__dirname, '../src/main'),
      '@renderer': path.join(__dirname, '../src/renderer'),
      '@shared': path.join(__dirname, '../src/shared'),
    },
    extensions: ['.web.ts', '.web.js', '.ts', '.tsx', '.js', '.json'],
  },
  target: 'web',
};

const sharedDefinedVariables = {};

/**
 * Adjust webConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  webConfig.plugins.push(
    new ForkTsCheckerWebpackPlugin({ eslint: true, vue: true }),
    new webpack.DefinePlugin(
      Object.assign(sharedDefinedVariables, {
        'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.stage.sagittarius.ai:8443'}"`,
        'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API ||
          'https://account.stage.splayer.org'}"`,
        'process.env.ACCOUNT_SITE': `"${process.env.ACCOUNT_SITE ||
          'https://account.stage.splayer.org'}"`,
        __static: `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
      }),
    ),
  );
} else {
  webConfig.plugins.push(
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 100000,
    }),
  );
}

/**
 * Adjust webConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  webConfig.mode = 'production';
  webConfig.devtool = '#source-map';

  webConfig.plugins.push(
    new webpack.DefinePlugin(
      Object.assign(sharedDefinedVariables, {
        'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.sagittarius.ai:8443'}"`,
        'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API || 'https://account.splayer.org'}"`,
        'process.env.ACCOUNT_SITE': `"${process.env.ACCOUNT_SITE || 'https://account.splayer.org'}"`,
        'process.env.SENTRY_RELEASE': `"${release}"`,
        'process.env.NODE_ENV': '"production"',
      }),
    ),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  );

  webConfig.optimization = {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2,
        },
      },
    },
  };

  if (process.platform === 'darwin') {
    // only check on mac, to speed up Windows build
    webConfig.plugins.push(new ForkTsCheckerWebpackPlugin({ eslint: true, vue: true }));
  }
}

module.exports = webConfig;
