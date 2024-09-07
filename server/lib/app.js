/* eslint-disable no-console */
const express = require('express');
const ws = require('ws');
const cors = require('cors');
const OpenApiValidator = require('express-openapi-validator');
const logger = require('winston');
const reportError = require('./errors');
const GameManager = require('./game-manager');
const GameManagerNetAdapter = require('./game-manager-net-adapter');

function initApp(config) {
  const serverID = `${process.pid}:${Date.now()}`;
  logger.info(`Initializing server (id=${serverID})`);

  const gameManager = new GameManager(config);
  gameManager.init();

  function generateServerInfo() {
    return {
      type: 'serverInfo',
      serverID,
    };
  }

  logger.verbose('Initializing Express app');
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(
    OpenApiValidator.middleware({
      apiSpec: '../specs/openapi.yaml',
      validateRequests: true,
      validateResponses: true,
    })
  );

  const adapter = new GameManagerNetAdapter(gameManager);

  app.get('/config', (req, res) => {
    logger.debug('GET /config');
    res.json(config);
  });

  logger.debug('Initializing WebSocket Server');
  const wss = new ws.Server({ noServer: true, clientTracking: true });

  wss.on('connection', (socket, req) => {
    // eslint-disable-next-line no-underscore-dangle
    const ip = socket._socket.remoteAddress;
    logger.info(`Client connected from ${ip} (${wss.clients.size} clients)`);
    logger.info(`User Agent: ${req.headers['user-agent']}`);

    socket.on('message', (data) => {
      const message = JSON.parse(data);
      if (typeof message === 'object' && typeof message.type === 'string') {
        switch (message.type) {
          case 'info':
            socket.send(JSON.stringify(generateServerInfo()));
            break;
          case 'ping':
            socket.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'sync':
            adapter.processSync(message);
            socket.send(JSON.stringify(adapter.generateSync()));
            break;
          case 'addPlayer':
            adapter.processAddPlayer(message);
            break;
          case 'removePlayer':
            adapter.processRemovePlayer(message);
            break;
          case 'playerReady':
            adapter.processPlayerReady(message);
            break;
          default:
            reportError(`Error: Received message of unknown type '${message.type}'`);
            break;
        }
      } else {
        reportError(`Error: Received invalid message via websocket:\n${data}`);
      }
    });

    socket.on('close', (code, reason) => {
      logger.info(`Socket closed (code: ${code} reason: '${reason}')`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error (code: ${err.code}): ${err.message}`);
    });

    socket.send(JSON.stringify(generateServerInfo()));
  });

  wss.on('close', () => {
    logger.info('WebSocket Server closed');
  });

  wss.on('error', (err) => {
    reportError(`WebSocket Server error: ${err.message}`);
  });

  wss.on('wsClientError', (err) => {
    reportError(`WebSocket Server client error: ${err.message}`);
  });

  return [app, wss];
}

module.exports = initApp;
