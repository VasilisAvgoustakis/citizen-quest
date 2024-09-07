const GameManagerStates = require('./game-manager-states/states');
const reportError = require('./errors');

/**
 * Adapter for the GameManager to handle network messages.
 *
 * This class is responsible for processing messages from the network and
 * generating messages to be sent over the network.
 */
class GameManagerNetAdapter {
  constructor(gameManager) {
    this.gameManager = gameManager;
  }

  processSync(message) {
    // Ignore sync messages from previous rounds
    if (message.round !== this.gameManager?.round?.id) {
      return;
    }
    // Ignore sync messages if the round is not in progress
    if (this.gameManager.getState() !== GameManagerStates.ROUND_IN_PROGRESS) {
      return;
    }
    if (message.players) {
      Object.entries(message.players).forEach(([id, props]) => {
        const player = this.gameManager.round.getPlayer(id);
        if (player) {
          if (props.position) {
            player.setPosition(props.position.x, props.position.y);
          }
          if (props.speed) {
            player.setSpeed(props.speed.x, props.speed.y);
          }
        }
      });
    }
    if (message.flags) {
      this.gameManager.round.setFlags(message.flags);
    }
  }

  processAddPlayer(message) {
    if (message.playerID) {
      this.gameManager.handleAddPlayer(message.playerID);
    } else {
      reportError('Error: Received addPlayer message without playerID');
    }
  }

  processRemovePlayer(message) {
    if (message.playerID) {
      this.gameManager.handleRemovePlayer(message.playerID);
    } else {
      reportError('Error: Received removePlayer message without playerID');
    }
  }

  processPlayerReady(message) {
    if (message.state && message.playerID) {
      // Ignore playerReady messages if the state has changed
      if (this.gameManager.getState() !== message.state) {
        return;
      }
      this.gameManager.handlePlayerReady(message.playerID);
    } else {
      reportError('Error: Received playerReady message without state or playerID');
    }
  }

  generateSync() {
    const message = {
      type: 'sync',
      state: this.gameManager.getDeprecatedStateName(),
    };

    const { round } = this.gameManager;

    Object.assign(message, {
      round: round.id,
      storyline: round.storyline,
      players: Object.values(round.players).reduce((acc, player) => {
        acc[player.id] = {
          position: player.position,
          speed: player.speed,
        };
        return acc;
      }, {}),
      flags: round.flags.asJSON(),
    });

    if (this.gameManager.getState() === GameManagerStates.ROUND_IN_PROGRESS) {
      message.roundCountdown = round.getRoundCountdown();
    }

    return message;
  }
}

module.exports = GameManagerNetAdapter;
