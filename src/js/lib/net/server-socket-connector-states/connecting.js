const logger = require('loglevel');
const ServeSocketConnectorState = require('./server-socket-connector-state');

class ConnectingState extends ServeSocketConnectorState {
  constructor(connector) {
    super(connector);

    this.connectTimeout = null;
  }

  onEnter() {
    const timeout = this.connector.config.network.connectTimeout || 3000;
    this.connectTimeout = setTimeout(() => {
      logger.warn(`Connecting timed out, reconnecting in ${timeout / 1000} seconds...`);
      this.connector.connect();
    }, timeout);
  }

  onExit() {
    clearTimeout(this.connectTimeout);
  }
}

module.exports = ConnectingState;
