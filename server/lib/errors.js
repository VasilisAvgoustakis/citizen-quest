const Sentry = require('@sentry/node');
const logger = require('winston');

function reportError(error) {
  // If error is a string
  if (typeof error === 'string') {
    logger.error(error);
    Sentry.captureMessage(error);
  } else {
    logger.error(error.message);
    logger.error(error.stack);
    Sentry.captureException(error);
  }
}

module.exports = reportError;
