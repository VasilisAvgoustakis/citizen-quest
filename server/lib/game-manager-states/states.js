/**
 * Game states.
 *
 * See `doc/dev/game-states.md` for a description of the game states.
 *
 * @type {{IDLE: string, ROUND_STARTING: string, ROUND_IN_PROGRESS: string, ROUND_COMPLETED: string}}
 */

const GameManagerStates = {
  IDLE: 'idle',
  ROUND_STARTING: 'roundStarting',
  ROUND_IN_PROGRESS: 'roundInProgress',
  ROUND_COMPLETED: 'roundCompleted',
};

module.exports = GameManagerStates;
