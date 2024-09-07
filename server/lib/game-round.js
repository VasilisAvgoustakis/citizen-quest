const FlagStore = require('../../src/js/lib/model/flag-store');
const Character = require('../../src/js/lib/model/character');

/**
 * This class is responsible for managing the state of a game round.
 *
 * A round is a single game session where players interact with a storyline.
 */
class GameRound {
  /**
   * Create a new GameRound object.
   * @param {string} storyline
   */
  constructor(storyline) {
    this.id = GameRound.newRoundId();
    this.startTime = null;
    this.storyline = storyline;
    this.flags = new FlagStore();
    this.players = {};
    this.readyPlayers = new Set();
  }

  /**
   * Get a new round ID.
   * @static
   * @return {number}
   */
  static newRoundId() {
    GameRound.lastId += 1;
    return GameRound.lastId;
  }

  /**
   * Start the countdown for the round.
   */
  startCountdown() {
    this.startTime = Date.now();
  }

  /**
   * Get the remaining time for the round.
   *
   * @param {number} duration
   *  The duration of the round in seconds
   * @return {number}
   */
  getRoundCountdown(duration) {
    if (!this.startTime) {
      return duration;
    }
    return Math.max(
      0,
      duration * 1000 - (Date.now() - this.startTime)
    );
  }

  addPlayer(playerId, options) {
    this.players[playerId] = new Character(playerId, options);
  }

  hasPlayer(playerId) {
    return this.players[playerId] !== undefined;
  }

  getPlayer(playerId) {
    return this.players[playerId] ?? null;
  }

  getPlayerCount() {
    return Object.keys(this.players).length;
  }

  removePlayer(playerId) {
    delete this.players[playerId];
    this.readyPlayers.delete(playerId);
  }

  markPlayerReady(playerId) {
    if (!this.hasPlayer(playerId)) {
      throw new Error(`Error: Attempting to mark unknown player ${playerId} as ready`);
    }
    this.readyPlayers.add(playerId);
  }

  isAPlayerReady() {
    return this.readyPlayers.size > 0;
  }

  areAllPlayersReady() {
    return Object.keys(this.players).every((playerId) => this.readyPlayers.has(playerId));
  }

  clearReadyPlayers() {
    this.readyPlayers.clear();
  }

  setFlags(flags) {
    Object.entries(flags).forEach(([id, value]) => {
      if (!this.flags.exists(id)) {
        this.flags.set(id, value);
        console.log(`Flag ${id} set to ${value}`);
      }
    });
  }
}

/**
 * The last ID assigned to a round.
 * @type {number}
 */
GameRound.lastId = 0;

module.exports = GameRound;
