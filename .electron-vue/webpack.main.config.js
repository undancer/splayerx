'use strict';

process.env.BABEL_ENV = 'main';

const path = require('path');
const childProcess = require('child_process');
const webpack = require('webpack');
const {
  dependencies,
  optionalDependencies,
} = require('../package.json');
const TerserPlugin = require('terser-webpack-plugin');

let release = '';
try {
  const result = childProcess.spawnSync('git', [
    'describe',
    '--tag',
    '--exact-match',
    '--abbrev=0',
  ]);
  if (result.status === 0) {
    const tag = result.stdout.toString('utf8')
      .replace(/^\s+|\s+$/g, '');
    if (tag) release = `SPlayer${tag}`;
  }
} catch (ex) {
  console.error(ex);
}

// /**
//  * @type {import('webpack').Configuration}
//  */
let mainConfig = {
  mode: 'development',
  devtool: '#source-map',
  entry: {
    main: path.join(__dirname, '../src/main/index.js'),
  },
  externals: [...Object.keys(Object.assign({}, dependencies, optionalDependencies))],
  module: {
    rules: [
      {
        test: /\.js$/,
        // use: 'babel-loader',
        exclude: file => (
          /node_modules/.test(file) &&
          !/\.vue\.js/.test(file)
        ),
        loader: 'esbuild-loader',
        options: {
          loader: 'js',
          target: 'es2015',
          //   loader: 'jsx',  // Remove this if you're not using JSX
          //   target: 'es2015',  // Syntax to compile to (see options below for possible values)
        },
      },
      {
        test: /\.ts$/,
        // use: 'babel-loader',
        exclude: file => (
          /node_modules/.test(file) &&
          !/\.vue\.js/.test(file)
        ),
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2015',
          //   loader: 'jsx',  // Remove this if you're not using JSX
          //   target: 'es2015',  // Syntax to compile to (see options below for possible values)
        },
      },
      // {
      //   test: /\.node$/,
      //   use: 'node-loader',
      // },
      {
        test: /\.(png|jpe?g|gif|svg|ico|icns)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 1000000,
          },
        },
      },
    ],
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production',
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron'),
  },
  plugins: [],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@main': path.join(__dirname, '../src/main'),
      '@renderer': path.join(__dirname, '../src/renderer'),
      '@shared': path.join(__dirname, '../src/shared'),
    },
  },
  target: 'electron-main',
};

const sharedDefinedVariables = {};

/**
 * Adjust mainConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  mainConfig.plugins.push(
    new webpack.DefinePlugin(Object.assign(sharedDefinedVariables, {
      'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.stage.sagittarius.ai:8443'}"`,
      'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API || 'http://stage.account.splayer.work'}"`,
      'process.env.ACCOUNT_SITE': `"${process.env.ACCOUNT_SITE || 'http://stage.account.splayer.work'}"`,
      __static: `"${path.join(__dirname, '../static')
        .replace(/\\/g, '\\\\')}"`,
    })),
  );
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainConfig.mode = 'production';
  mainConfig.plugins.push(
    new webpack.DefinePlugin(Object.assign(sharedDefinedVariables, {
      'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.sagittarius.ai:8443'}"`,
      'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API || 'https://account.splayer.work'}"`,
      'process.env.ACCOUNT_SITE': `"${process.env.ACCOUNT_SITE || 'https://account.splayer.work'}"`,
      'process.env.SENTRY_RELEASE': `"${release}"`,
      'process.env.NODE_ENV': '"production"',
    })),
  );
  mainConfig.optimization = {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  };

  // if (!process.env.TEST && process.platform === 'darwin') {
  //   // only check on Mac, to speed up Windows build
  //   mainConfig.plugins.push(new ForkTsCheckerWebpackPlugin());
  // }
}

module.exports = mainConfig;
