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
const configureWinston = require('./lib/configure-winston');

const {
  port, settingsFile, outputConfiguration, sentryDsn, logLevel,
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
  // Add an option to control the log level
  .option('log-level', {
    default: process.env.LOG_LEVEL || 'info',
    describe: 'Log level for the server',
  })
  .argv;

const logger = configureWinston({ level: logLevel });

let sentryInitialized = false;
if (sentryDsn) {
  logger.info('Initializing Sentry (with DSN from command line)');
  Sentry.init({ dsn: sentryDsn });
  sentryInitialized = true;
}

logger.verbose('Loading configuration');
const cfgLoader = new CfgLoader(CfgReaderFile, yaml.load);
cfgLoader.load([
  '../config/system.yml',
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
    logger.verbose('Configuration loaded');
    if (outputConfiguration) {
      logger.info('Active configuration:');
      logger.info('--- begin ---');
      logger.info(yaml.dump(config));
      logger.info('--- end ---');
    }
    if (!sentryInitialized && config?.system?.sentry?.dsn) {
      logger.info('Initializing Sentry (with DSN from configuration)');
      Sentry.init({ dsn: config.system.sentry.dsn });
      sentryInitialized = true;
    }
    logger.verbose('Loading storylines');
    return storylineLoader(cfgLoader, '../config/storylines', config.storylines)
      .then((storylines) => {
        logger.verbose('Storylines loaded');
        config.storylines = storylines;
        return config;
      });
  })
  .catch((err) => {
    logger.error('Error loading configuration');
    logger.error(err);
    Sentry.captureException(err);
    process.exit(1);
  })
  .then((config) => {
    logger.verbose('Creating server');
    createServer(port, config);
    logger.info(`Listening on port ${port}`);
  })
  .catch((err) => {
    logger.error(err);
    Sentry.captureException(err);
  });
