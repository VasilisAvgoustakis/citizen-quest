const logger = require('loglevel');
const ServeSocketConnectorState = require('./server-socket-connector-state');

class ReconnectDelayState extends ServeSocketConnectorState {
  constructor(connector) {
    super(connector);

    this.timeout = null;
  }

  onEnter() {
    this.connector.events.emit('connectWait');
    const reconnectTime = this.connector.config.network.reconnectTime || 5000;
    logger.info(`Reconnecting in ${reconnectTime / 1000} seconds...`);
    this.timeout = setTimeout(() => {
      this.connector.connect();
    }, reconnectTime);
  }

  onExit() {
    clearTimeout(this.reconnectTimeout);
  }
}

module.exports = ReconnectDelayState;
