class GameManagerState {
  constructor(gameManager) {
    this.gameManager = gameManager;
  }

  /**
   * Handler called when entering this state.
   *
   * @param {GameManagerState} fromState
   *  The state we're transitioning from.
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  onEnter(fromState) {
    this.gameManager.round?.clearReadyPlayers();
  }

  /**
   * Handler called when exiting this state.
   *
   * @param {GameManagerState} toState
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  onExit(toState) { }

  /**
   * Handler called when a request to add a player to the game is received.
   *
   * @param {string} playerId
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  onAddPlayer(playerId) { }

  /**
   * Handler called when a request to remove a player from the game is received.
   *
   * @param {string} playerId
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  onRemovePlayer(playerId) { }

  /**
   * Handler called when a player is ready to move to the next state.
   *
   * @param {string} playerId
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  onPlayerReady(playerId) { }

  /**
   * Handler called when the game state times out.
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  onTimeout() { }
}

module.exports = GameManagerState;
