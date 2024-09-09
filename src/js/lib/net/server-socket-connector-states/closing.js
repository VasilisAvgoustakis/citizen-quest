const logger = require('loglevel');
const ServeSocketConnectorState = require('./server-socket-connector-state');

class ClosingState extends ServeSocketConnectorState {
  constructor(connector) {
    super(connector);

    this.timeout = null;
  }

  onEnter() {
    // The attempt to close the socket cleanly timed out, so we're going to force it closed.
    const timeout = this.connector.config.network.closeTimeout || 15000;
    this.timeout = setTimeout(() => {
      logger.warn(`Closing timed out after ${timeout / 1000} seconds, forcing close.`);
      this.connector.onClose();
    }, timeout);
  }

  onExit() {
    clearTimeout(this.timeout);
  }
}

module.exports = ClosingState;
