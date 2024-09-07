const GameManagerState = require('./game-manager-state');
const { ROUND_IN_PROGRESS, ROUND_COMPLETED } = require('./states');

class RoundInProgressState extends GameManagerState {
  constructor(gameManager) {
    super(gameManager);
    this.state = ROUND_IN_PROGRESS;
  }

  onEnter() {
    super.onEnter();
    this.gameManager.round.startTime = Date.now();
    if (this.gameManager.config.game.duration) {
      this.gameManager.setStateTimeout(this.gameManager.config.game.duration * 1000);
    }
  }

  onAddPlayer(playerId) {
    super.onAddPlayer(playerId);
    this.gameManager.addPlayer(playerId);
  }

  onRemovePlayer(playerId) {
    super.onRemovePlayer(playerId);
    // The game ends when the last player leaves.
    if (this.gameManager.round.getPlayerCount() === 1) {
      this.gameManager.setState(ROUND_COMPLETED);
    } else {
      this.gameManager.removePlayer(playerId);
    }
    if (this.gameManager.round.areAllPlayersReady()) {
      this.gameManager.setState(ROUND_COMPLETED);
    }
  }

  onPlayerReady(playerId) {
    super.onPlayerReady(playerId);
    this.gameManager.round.markPlayerReady(playerId);
    if (this.gameManager.round.areAllPlayersReady()) {
      this.gameManager.setState(ROUND_COMPLETED);
    }
  }

  onTimeout() {
    super.onTimeout();
    this.gameManager.setState(ROUND_COMPLETED);
  }
}

module.exports = RoundInProgressState;
