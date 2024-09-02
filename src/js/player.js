/* eslint-disable no-console */
const ServerSocketConnector = require('./lib/net/server-socket-connector');
const ConnectionStateView = require('./lib/net/connection-state-view');
const showFatalError = require('./lib/helpers-web/show-fatal-error');
require('../sass/default.scss');
const { getApiServerUrl, getSocketServerUrl } = require('./lib/net/server-url');
const { initSentry } = require('./lib/helpers/sentry');
const PlayerApp = require('./lib/app/player-app');
const GameServerController = require('./lib/app/game-server-controller');
const fetchConfig = require('./lib/helpers-client/fetch-config');
const fetchTextures = require('./lib/helpers-client/fetch-textures');
const PlayerAppStates = require('./lib/app/player-app-states/states');
const Character = require('./lib/model/character');

(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('p') || '1';
    const statsPanel = urlParams.get('s') || null;
    const configUrl = `${getApiServerUrl()}config`;

    const sentryDSN = urlParams.get('sentry-dsn') || process.env.SENTRY_DSN;
    let sentryInitialized = false;
    if (sentryDSN) {
      initSentry(sentryDSN);
      sentryInitialized = true;
    }

    const config = await fetchConfig(configUrl);
    if (!sentryInitialized && config?.system?.sentry?.dsn) {
      initSentry(config.system.sentry.dsn);
      sentryInitialized = true;
    }
    const textures = await fetchTextures('./static/textures', config.textures, 'town-view');
    const playerApp = new PlayerApp(config, textures, playerId);
    let round = 0;

    $('[data-component="PlayerApp"]').replaceWith(playerApp.$element);
    playerApp.refresh();

    let syncReceived = false;
    const connector = new ServerSocketConnector(config, getSocketServerUrl());
    const connStateView = new ConnectionStateView(connector);
    $('body').append(connStateView.$element);

    playerApp.setGameServerController(new GameServerController(playerApp, connector));
    playerApp.setState(PlayerAppStates.IDLE);

    connector.events.on('connect', () => {
      syncReceived = true;
    });
    connector.events.on('sync', (message) => {
      syncReceived = true;
      playerApp.stats.ping();
      // If a new round started
      if (message.round && message.storyline
        && (round !== message.round || playerApp.storylineId !== message.storyline)) {
        round = message.round;
        playerApp.setStoryline(message.storyline);
      }
      // Sync the game state
      if (message.state && message.state !== playerApp.getState()) {
        if (message.players[playerId] === undefined) {
          playerApp.setState(PlayerAppStates.IDLE);
        } else {
          playerApp.setState(message.state);
        }
      }
      // Update the countdown
      if (message.roundCountdown) {
        const seconds = Math.ceil(message.roundCountdown / 1000);
        if (seconds < playerApp.roundTimer.getRemainingTime()) {
          playerApp.roundTimer.setRemainingTime(seconds);
        }
      }
      // Move the players
      Object.entries(message.players).forEach(([id, player]) => {
        if (id === playerId) {
          if (playerApp.gameView.pcView === null) {
            playerApp.addPc();
            playerApp.pc.setPosition(player.position.x, player.position.y);
          }
        }
        if (id !== playerId) {
          if (playerApp.remotePcs[id] === undefined) {
            playerApp.remotePcs[id] = new Character(id, config.players[id]);
            playerApp.gameView.addRemotePcView(playerApp.remotePcs[id]);
          }
          if (player.position) {
            playerApp.remotePcs[id].setPosition(player.position.x, player.position.y);
          }
          if (player.speed) {
            playerApp.remotePcs[id].setSpeed(player.speed.x, player.speed.y);
          }
        }
      });
      // Remove players that were not included in the sync
      Object.keys(playerApp.remotePcs).forEach((id) => {
        if (message.players[id] === undefined) {
          delete playerApp.remotePcs[id];
          playerApp.gameView.removeRemotePcView(id);
        }
      });
      // Remove the PC if it was not included in the sync
      if (playerApp.pc !== null && message.players[playerId] === undefined) {
        playerApp.removePc();
      }
      if (message.flags) {
        // Add all the flags from message.flags not present in playerApp.flags.flags
        Object.keys(message.flags).forEach((flag) => {
          if (!playerApp.flags.exists(flag)) {
            playerApp.flags.set(flag, message.flags[flag], 'remote');
            console.log(`Adding flag ${flag} with value ${message.flags[flag]}`);
          }
        });
      }
    });
    playerApp.pixiApp.ticker.add(() => {
      if (syncReceived) {
        connector.sync(round, playerApp.pc, playerApp.flags);
        syncReceived = false;
      }
    });

    if (statsPanel) {
      playerApp.stats.showPanel(statsPanel);
    }
  } catch (err) {
    showFatalError(err.message, err);
    // eslint-disable-next-line no-console
    console.error(err);
  }
})();
