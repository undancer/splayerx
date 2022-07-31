'use strict';

process.env.BABEL_ENV = 'renderer';

const path = require('path');
const childProcess = require('child_process');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {
  dependencies,
  optionalDependencies,
} = require('../package.json');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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

function generateHtmlWebpackPluginConfig(name) {
  return {
    chunks: [name],
    filename: `${name}.html`,
    template: path.resolve(__dirname, `../src/index.ejs`),
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
let whiteListedModules = ['vue'];

let rendererConfig = {
  mode: 'development',
  devtool: '#module-eval-source-map',
  entry: {
    preference: path.join(__dirname, '../src/renderer/preference.js'),
    about: path.join(__dirname, '../src/renderer/about.js'),
    losslessStreaming: path.join(__dirname, '../src/renderer/losslessStreaming.js'),
    payment: path.join(__dirname, '../src/renderer/payment.ts'),
    index: path.join(__dirname, '../src/renderer/main.ts'),
    browsing: path.join(__dirname, '../src/renderer/browsing.ts'),
    openUrl: path.join(__dirname, '../src/renderer/openUrl.ts'),
    download: path.join(__dirname, '../src/renderer/download.ts'),
    downloadList: path.join(__dirname, '../static/download/downloadList.ts'),
  },
  externals: [
    ...Object.keys(Object.assign({}, dependencies, optionalDependencies))
      .filter(module => !whiteListedModules.includes(module)),
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader',
      },
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
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: { indentedSyntax: 1 },
          },
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
              name: 'imgs/[name]--[folder].[ext]',
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
            name: 'media/[name]--[folder].[ext]',
          },
        },
      },
      {
        test: /\.(woff2?|eot|ttf|ttc|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]',
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
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('index')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('about')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('losslessStreaming')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('payment')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('preference')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('browsing')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('openUrl')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('download')),
    new HtmlWebpackPlugin(generateHtmlWebpackPluginConfig('downloadList')),
    new webpack.HotModuleReplacementPlugin(),
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron'),
    globalObject: 'this',
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      '@main': path.join(__dirname, '../src/main'),
      '@renderer': path.join(__dirname, '../src/renderer'),
      '@shared': path.join(__dirname, '../src/shared'),
    },
    extensions: ['.ts', '.tsx', '.js', '.vue', '.json'],
  },
  target: 'electron-renderer',
};

const sharedDefinedVariables = {
  'process.platform': `"${process.platform}"`,
};

if (process.env.ENVIRONMENT_NAME === 'APPX') {
  // quick fix for process.windowsStore undefined on Windows Store build
  sharedDefinedVariables['process.windowsStore'] = 'true';
}
/**
 * Adjust rendererConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  // if (!process.env.TEST && process.platform === 'darwin') {
  //   rendererConfig.plugins.push(new ForkTsCheckerWebpackPlugin());
  // }
  rendererConfig.plugins.push(
    new webpack.DefinePlugin(
      Object.assign(sharedDefinedVariables, {
        'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.stage.sagittarius.ai:8443'}"`,
        'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API ||
        'http://stage.account.splayer.work'}"`,
        'process.env.ACCOUNT_SITE': `"${process.env.ACCOUNT_SITE ||
        'http://stage.account.splayer.work'}"`,
        __static: `"${path.join(__dirname, '../static')
          .replace(/\\/g, '\\\\')}"`,
      }),
    ),
  );
}

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.mode = 'production';
  rendererConfig.devtool = '#source-map';

  rendererConfig.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../static'),
          to: path.join(__dirname, '../dist/electron/static'),
          // ignore: ['.*'],
        },
      ],
    }),
    new webpack.DefinePlugin(
      Object.assign(sharedDefinedVariables, {
        'process.env.SAGI_API': `"${process.env.SAGI_API || 'apis.sagittarius.ai:8443'}"`,
        'process.env.ACCOUNT_API': `"${process.env.ACCOUNT_API || 'https://account.splayer.work'}"`,
        'process.env.ACCOUNT_SITE': `"${process.env.ACCOUNT_SITE || 'https://account.splayer.work'}"`,
        'process.env.SENTRY_RELEASE': `"${release}"`,
        'process.env.NODE_ENV': '"production"',
      }),
    ),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  );

  rendererConfig.optimization = {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  };

  // if (process.platform === 'darwin') {
  //   // only check on Mac, to speed up Windows build
  //   rendererConfig.plugins.push(new ForkTsCheckerWebpackPlugin());
  // }

  if (release && process.env.SENTRY_AUTH_TOKEN) {
    rendererConfig.plugins.push(
      new SentryWebpackPlugin({
        release,
        include: './dist',
        urlPrefix: 'app:///dist/',
        ext: ['js', 'map'],
        ignore: ['node_modules'],
      }),
      new SentryWebpackPlugin({
        release,
        include: './src',
        urlPrefix: 'webpack:///./src/',
        ext: ['js', 'ts', 'vue'],
        ignore: ['node_modules'],
      }),
    );
  }
}

module.exports = rendererConfig;
