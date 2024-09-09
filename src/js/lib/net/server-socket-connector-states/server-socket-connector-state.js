const logger = require('loglevel');

class ServeSocketConnectorState {
  constructor(connector) {
    this.connector = connector;
  }

  // eslint-disable-next-line class-methods-use-this
  onEnter() { }

  // eslint-disable-next-line class-methods-use-this
  onExit() { }

  onMessage(event) {
    const className = this.constructor.name;
    logger.error(`Unhandled message in ${className}:`, event.data);
  }
}

module.exports = ServeSocketConnectorState;
