const GameManagerState = require('./game-manager-state');
const { IDLE, ROUND_COMPLETED} = require('./states');

class RoundCompletedState extends GameManagerState {
  constructor(gameManager) {
    super(gameManager);
    this.state = ROUND_COMPLETED;
  }

  onEnter() {
    super.onEnter();
    if (this.gameManager.config?.game?.endingTimeout) {
      this.gameManager.setStateTimeout(this.gameManager.config.game.endingTimeout * 1000 + 3000);
    }
  }

  onExit() {
    super.onExit();
    this.gameManager.destroyRound();
  }

  onAddPlayer(playerId) {
    super.onAddPlayer(playerId);
    this.gameManager.queuePlayer(playerId);
  }

  onPlayerReady(playerId) {
    super.onPlayerReady(playerId);
    this.gameManager.round.markPlayerReady(playerId);
    if (this.gameManager.round.areAllPlayersReady()) {
      this.gameManager.setState(IDLE);
    }
  }

  onTimeout() {
    super.onTimeout();
    this.gameManager.setState(IDLE);
  }
}

module.exports = RoundCompletedState;
