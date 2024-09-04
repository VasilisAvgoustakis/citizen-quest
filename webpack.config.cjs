const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const appConfig = require('./app.config.json');

module.exports = {
  entry: {
    default: './src/js/main.js',
    player: './src/js/player.js',
    map: './src/js/map.js',
    test: './src/js/test.js',
    charEdit: './src/js/char-edit.js',
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'assets'),
  },
  module: {
    rules: [
      {
        test: /\.(scss|css)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '',
            },
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new Dotenv(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/index.html'),
      filename: path.resolve(__dirname, 'index.html'),
      chunks: ['default'],
      minify: true,
      title: appConfig.title,
      meta: {
        title: appConfig.title,
        description: appConfig.description,
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/player.html'),
      filename: path.resolve(__dirname, 'player.html'),
      chunks: ['player'],
      minify: true,
      title: `Player | ${appConfig.title}`,
      meta: {
        title: `Player | ${appConfig.title}`,
        description: appConfig.description,
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/map.html'),
      filename: path.resolve(__dirname, 'map.html'),
      chunks: ['map'],
      minify: true,
      title: `Map | ${appConfig.title}`,
      meta: {
        title: `Map | ${appConfig.title}`,
        description: appConfig.description,
      }
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/test.html'),
      filename: path.resolve(__dirname, 'test.html'),
      chunks: ['test'],
      minify: true,
      title: `Test | ${appConfig.title}`,
      meta: {
        title: `Test | ${appConfig.title}`,
        description: appConfig.description,
      }
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/char-edit.html'),
      filename: path.resolve(__dirname, 'char-edit.html'),
      chunks: ['charEdit'],
      minify: true,
      title: `Char Editor | ${appConfig.title}`,
      meta: {
        title: `Char Editor | ${appConfig.title}`,
        description: appConfig.description,
      }
    }),
    new CleanWebpackPlugin({
      // todo: temporary measure. Dev builds should be done without hashes in the filename.
      cleanOnceBeforeBuildPatterns: ['**/*'],
    }),
  ],
  mode: 'development',
  // Todo: change the source map settings for production builds
  devtool: 'source-map',
};
