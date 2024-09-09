const logger = require('loglevel');

function configureLogger(options) {
  logger.setLevel(options.level);

  return logger;
}

module.exports = configureLogger;
