const logger = require('loglevel');
const ServeSocketConnectorState = require('./server-socket-connector-state');

class OpenState extends ServeSocketConnectorState {
  constructor(connector) {
    super(connector);

    this.pingTimeout = null;
    this.pongTimeout = null;
    this.serverInfoTimeout = null;
  }

  onEnter() {
    this.schedulePing();
    this.scheduleServerInfoTimeout();
  }

  onExit() {
    clearTimeout(this.pingTimeout);
    clearTimeout(this.pongTimeout);
    clearTimeout(this.serverInfoTimeout);
  }

  schedulePing() {
    this.cancelPing();
    const timeout = this.connector.config.network.pingTime || 10000;
    this.pingTimeout = setTimeout(() => {
      this.pingTimeout = null;
      this.ping();
    }, timeout);
  }

  cancelPing() {
    if (this.pingTimeout !== null) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  ping() {
    this.connector.send('ping');
    this.startPongTimeout();
  }

  startPongTimeout() {
    this.cancelPongTimeout();
    const timeout = this.connector.config.network.pongWaitTime || 10000;
    this.pongTimeout = setTimeout(() => {
      this.pongTimeout = null;
      logger.warn(`PONG not received after ${timeout / 1000} seconds`);
      logger.warn('Resetting connection.');
      this.connector.close();
    }, timeout);
  }

  cancelPongTimeout() {
    if (this.pongTimeout !== null) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  scheduleServerInfoTimeout() {
    this.cancelServerInfoTimeout();
    const timeout = this.connector.config.network.pongWaitTime || 10000;
    this.serverInfoTimeout = setTimeout(() => {
      this.serverInfoTimeout = null;
      logger.warn(`No serverInfo received after ${timeout / 1000} seconds`);
      logger.warn('Resetting connection');
      this.connector.close();
    }, timeout);
  }

  cancelServerInfoTimeout() {
    if (this.serverInfoTimeout !== null) {
      clearTimeout(this.serverInfoTimeout);
      this.serverInfoTimeout = null;
    }
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.type === 'sync') {
      this.handleSync(message);
    } else if (message.type === 'pong') {
      this.handlePong();
    } else if (message.type === 'serverInfo') {
      this.handleServerInfo(message);
    }
  }

  handleSync(message) {
    this.connector.onSync(message);
  }

  handlePong() {
    this.cancelPongTimeout();
    this.schedulePing();
  }

  handleServerInfo(message) {
    this.cancelServerInfoTimeout();
    this.connector.onServerId(message.serverID);
  }
}

module.exports = OpenState;
