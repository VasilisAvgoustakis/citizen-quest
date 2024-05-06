/* eslint-disable no-console */
const path = require('path');
const Sentry = require('@sentry/node');
const yargs = require('yargs');
const yaml = require('js-yaml');
const { hideBin } = require('yargs/helpers');
const createServer = require('./lib/server');
const CfgLoader = require('../src/js/lib/loader/cfg-loader');
const CfgReaderFile = require('../src/js/lib/loader/cfg-reader-file');
const storylineLoader = require('../src/js/lib/loader/storyline-loader');

const {
  port, settingsFile, outputConfiguration, sentryDsn,
} = yargs(hideBin(process.argv))
  .option('p', {
    alias: 'port',
    describe: 'Port to listen on',
    default: process.env.PORT || '4850',
    coerce: (opt) => Number.parseInt(opt, 10),
  })
  .option('s', {
    alias: 'settings-file',
    describe: 'Settings file to load (can be a list of files separated by the system path delimiter)',
    default: process.env.SETTINGS_FILE?.split(path.delimiter) || '../settings.yml',
  })
  .option('o', {
    alias: 'output-configuration',
    describe: 'Output the active configuration',
    type: 'boolean',
    default: process.env.OUTPUT_CONFIG || false,
  })
  .option('sentry-dsn', {
    default: process.env.SENTRY_DSN || null,
    describe: 'Sentry DSN for error reporting',
  })
  .argv;

if (sentryDsn) {
  console.log('Initializing Sentry');
  Sentry.init({ dsn: sentryDsn });
}

const cfgLoader = new CfgLoader(CfgReaderFile, yaml.load);
cfgLoader.load([
  '../config/game.yml',
  '../config/net.yml',
  '../config/players.yml',
  '../config/i18n.yml',
  '../config/textures.yml',
  '../config/town.yml',
  '../config/gamepads.yml',
  '../config/map.yml',
  '../config/storylines.yml',
  ...[settingsFile].flat(), // settingsFile may be a string or array of strings
])
  .then((config) => {
    if (outputConfiguration) {
      console.log('Active configuration:');
      console.log('--- begin ---');
      console.log(yaml.dump(config));
      console.log('--- end ---');
    }
    return storylineLoader(cfgLoader, '../config/storylines', config.storylines)
      .then((storylines) => {
        config.storylines = storylines;
        return config;
      });
})
  .catch((err) => {
    console.error('Error loading configuration');
    console.error(err);
    Sentry.captureException(err);
    process.exit(1);
  })
  .then((config) => {
    createServer(port, config);
    console.log(`Listening on port ${port}`);
  })
  .catch((err) => {
    console.error(err);
    Sentry.captureException(err);
  });
