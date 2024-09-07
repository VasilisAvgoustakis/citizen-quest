/* eslint-disable no-console */
const express = require('express');
const ws = require('ws');
const cors = require('cors');
const OpenApiValidator = require('express-openapi-validator');
const reportError = require('./errors');
const GameManager = require('./game-manager');
const GameManagerStates = require('./game-manager-states/states');

function initApp(config) {
  const serverID = `${process.pid}:${Date.now()}`;
  console.log(`Initializing server (id=${serverID})`);

  const gameManager = new GameManager(config);
  gameManager.events.on('roundCreated', (round, storyline) => {
    console.log(`Round ${round} created (${storyline})`);
  });
  gameManager.init();

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

  app.get('/config', (req, res) => {
    res.json(config);
  });

  function processSync(message) {
    // Ignore sync messages from previous rounds
    if (message.round !== gameManager?.round?.id) {
      return;
    }
    // Ignore sync messages if the round is not in progress
    if (gameManager.getState() !== GameManagerStates.ROUND_IN_PROGRESS) {
      return;
    }
    if (message.players) {
      Object.entries(message.players).forEach(([id, props]) => {
        const player = gameManager.round.getPlayer(id);
        if (player) {
          if (props.position) {
            player.setPosition(props.position.x, props.position.y);
          }
          if (props.speed) {
            player.setSpeed(props.speed.x, props.speed.y);
          }
        }
      });
    }
    if (message.flags) {
      gameManager.round.setFlags(message.flags);
    }
  }

  function processAddPlayer(message) {
    if (message.playerID) {
      gameManager.handleAddPlayer(message.playerID);
    } else {
      reportError('Error: Received addPlayer message without playerID');
    }
  }

  function processRemovePlayer(message) {
    if (message.playerID) {
      gameManager.handleRemovePlayer(message.playerID);
    } else {
      reportError('Error: Received removePlayer message without playerID');
    }
  }

  function processPlayerReady(message) {
    if (message.state && message.playerID) {
      // Ignore playerReady messages if the state has changed
      if (gameManager.getState() !== message.state) {
        return;
      }
      gameManager.handlePlayerReady(message.playerID);
    } else {
      reportError('Error: Received playerReady message without state or playerID');
    }
  }

  function sendServerInfo(socket) {
    socket.send(JSON.stringify({
      type: 'serverInfo',
      serverID,
    }));
  }

  function sendSync(socket) {
    const message = {
      type: 'sync',
      state: gameManager.getDeprecatedStateName(),
    };

    const { round } = gameManager;

    Object.assign(message, {
      round: round.id,
      storyline: round.storyline,
      players: Object.values(round.players).reduce((acc, player) => {
        acc[player.id] = {
          position: player.position,
          speed: player.speed,
        };
        return acc;
      }, {}),
      flags: round.flags.asJSON(),
    });

    if (gameManager.getState() === GameManagerStates.ROUND_IN_PROGRESS) {
      message.roundCountdown = round.getRoundCountdown(config.game.duration);
    }
    socket.send(JSON.stringify(message));
  }

  function sendPong(socket) {
    socket.send(JSON.stringify({
      type: 'pong',
    }));
  }

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
          case 'sync':
            processSync(message);
            sendSync(socket);
            break;
          case 'ping':
            sendPong(socket);
            break;
          case 'info':
            sendServerInfo(socket);
            break;
          case 'addPlayer':
            processAddPlayer(message);
            break;
          case 'removePlayer':
            processRemovePlayer(message);
            break;
          case 'playerReady':
            processPlayerReady(message);
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

    sendServerInfo(socket);
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
