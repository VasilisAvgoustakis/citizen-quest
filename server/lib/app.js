/* eslint-disable no-console */
const express = require('express');
const ws = require('ws');
const cors = require('cors');
const OpenApiValidator = require('express-openapi-validator');
const reportError = require('./errors');
const GameManager = require('./game-manager');
const GameManagerNetAdapter = require('./game-manager-net-adapter');

function initApp(config) {
  const serverID = `${process.pid}:${Date.now()}`;
  console.log(`Initializing server (id=${serverID})`);

  const gameManager = new GameManager(config);
  gameManager.events.on('roundCreated', (round, storyline) => {
    console.log(`Round ${round} created (${storyline})`);
  });
  gameManager.init();

  function generateServerInfo() {
    return {
      type: 'serverInfo',
      serverID,
    };
  }

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
    res.json(config);
  });

  const wss = new ws.Server({ noServer: true, clientTracking: true });

  wss.on('connection', (socket) => {
    // eslint-disable-next-line no-underscore-dangle
    const ip = socket._socket.remoteAddress;
    console.log(`Client connected from ${ip}`);
    console.log(`Connected (${wss.clients.size} clients)`);

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
      console.log(`Socket closed (code: ${code} reason: '${reason}')`);
    });

    socket.on('error', (err) => {
      reportError(`Socket error (code: ${err.code}): ${err.message}`);
    });

    socket.send(JSON.stringify(generateServerInfo()));
  });

  wss.on('close', () => {
    console.log('WebSocket Server closed');
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
