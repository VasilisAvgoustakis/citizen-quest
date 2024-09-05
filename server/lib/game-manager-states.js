/**
 * Game states.
 *
 * See `doc/dev/game-states.md` for a description of the game states.
 *
 * @type {{INTRO: string, IDLE: string, PLAYING: string, ENDING: string}}
 */

const GameManagerStates = {
  IDLE: 'idle',
  INTRO: 'intro',
  PLAYING: 'playing',
  ENDING: 'ending',
};

module.exports = GameManagerStates;
