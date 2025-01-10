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
const { configureLogger } = require('./lib/helpers/configure-logger');

(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('p') || '1';
  const statsPanel = urlParams.get('s') || null;
  const configUrl = `${getApiServerUrl()}config`;
  const logLevel = urlParams.get('log') || 'warn';
  const logger = configureLogger({ level: logLevel });

  try {
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

    $('[data-component="PlayerApp"]').replaceWith(playerApp.$element);
    playerApp.refresh();

    const connector = new ServerSocketConnector(config, getSocketServerUrl(), `player-${playerId}`);
    const connStateView = new ConnectionStateView(connector);
    $('body').append(connStateView.$element);
    connector.events.on('sync', () => {
      playerApp.stats.ping();
    });

    playerApp.setGameServerController(new GameServerController(playerApp, connector));
    playerApp.setState(PlayerAppStates.RESET);

    if (statsPanel) {
      playerApp.stats.showPanel(statsPanel);
    }

    if (window.CQ === undefined) {
      window.CQ = {
        playerApp,
      };
    }
  } catch (err) {
    showFatalError(err.message, err);
    logger.error(err);
  }
})();
