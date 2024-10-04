const {
  RESET,
  IDLE,
  QUEUED,
  INTRO,
  PLAYING,
  ENDING,
} = require('./states');
const PlayerAppResetState = require('./reset-state');
const PlayerAppIdleState = require('./idle-state');
const PlayerAppQueuedState = require('./queued-state');
const PlayerAppIntroState = require('./intro-state');
const PlayerAppPlayingState = require('./playing-state');
const PlayerAppEndingState = require('./ending-state');

function getHandler(playerApp, state) {
  switch (state) {
    case RESET:
      return new PlayerAppResetState(playerApp);
    case IDLE:
      return new PlayerAppIdleState(playerApp);
    case QUEUED:
      return new PlayerAppQueuedState(playerApp);
    case INTRO:
      return new PlayerAppIntroState(playerApp);
    case PLAYING:
      return new PlayerAppPlayingState(playerApp);
    case ENDING:
      return new PlayerAppEndingState(playerApp);
    default:
      throw new Error(`Invalid state ${state}`);
  }
}

module.exports = getHandler;
