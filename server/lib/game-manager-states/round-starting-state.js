const GameManagerState = require('./game-manager-state');
const { ROUND_IN_PROGRESS, ROUND_STARTING } = require('./states');

class RoundStartingState extends GameManagerState {
  constructor(gameManager) {
    super(gameManager);
    this.state = ROUND_STARTING;
  }

  onEnter() {
    super.onEnter();
    this.gameManager.addQueuedPlayers();
    if (this.gameManager.config?.game?.introTimeout) {
      this.gameManager.setStateTimeout(this.gameManager.config.game.introTimeout * 1000 + 3000);
    }
  }

  onAddPlayer(playerId) {
    super.onAddPlayer(playerId);
    this.gameManager.addPlayer(playerId);
  }

  onPlayerReady(playerId) {
    super.onPlayerReady(playerId);
    this.gameManager.round.markPlayerReady(playerId);
    if (this.gameManager.round.isAPlayerReady()) {
      this.gameManager.setState(ROUND_IN_PROGRESS);
    }
  }

  onTimeout() {
    super.onTimeout();
    this.gameManager.setState(ROUND_IN_PROGRESS);
  }
}

module.exports = RoundStartingState;
