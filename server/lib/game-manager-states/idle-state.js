const GameManagerState = require('./game-manager-state');
const { IDLE, ROUND_STARTING } = require('./states');

class IdleState extends GameManagerState {
  constructor(gameManager) {
    super(gameManager);
    this.state = IDLE;
  }

  onEnter() {
    super.onEnter();
    this.gameManager.destroyRound();
    this.gameManager.initializeRound();
    if (this.gameManager.hasQueuedPlayers()) {
      this.gameManager.setState(ROUND_STARTING);
    }
  }

  onAddPlayer(playerId) {
    super.onAddPlayer(playerId);
    this.gameManager.queuePlayer(playerId);
    this.gameManager.setState(ROUND_STARTING);
  }
}

module.exports = IdleState;
