const {
  IDLE,
  ROUND_STARTING,
  ROUND_IN_PROGRESS,
  ROUND_COMPLETED,
} = require('./states');
const IdleState = require('./idle-state');
const RoundStartingState = require('./round-starting-state');
const RoundInProgressState = require('./round-in-progress-state');
const RoundCompletedState = require('./round-completed-state');
const reportError = require('../errors');

function getHandler(gameManager, state) {
  switch (state) {
    case IDLE:
      return new IdleState(gameManager);
    case ROUND_STARTING:
      return new RoundStartingState(gameManager);
    case ROUND_IN_PROGRESS:
      return new RoundInProgressState(gameManager);
    case ROUND_COMPLETED:
      return new RoundCompletedState(gameManager);
    default:
      reportError(`Error: Attempting to create invalid state ${state}`);
      return new IdleState(this);
  }
}

module.exports = getHandler;
