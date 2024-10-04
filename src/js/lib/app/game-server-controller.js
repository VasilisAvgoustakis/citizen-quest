const logger = require('loglevel');
const Character = require('../model/character');
const { ROUND_IN_PROGRESS, ROUND_COMPLETED } = require('../../../../server/lib/game-manager-states/states');

class GameServerController {
  constructor(playerApp, connector) {
    this.playerApp = playerApp;
    this.connector = connector;
    this.syncReceived = false;
    this.round = null;
    this.roundState = null;
    this.sessionActive = false;
    this.lastReadyTime = 0;
    this.lastReadyRoundState = null;

    connector.events.on('connect', this.handleConnect.bind(this));
    connector.events.on('sync', this.handleSync.bind(this));

    this.playerApp.pixiApp.ticker.add(() => {
      if (this.syncReceived) {
        connector.sync(this.round, playerApp.pc, playerApp.flags);
        this.syncReceived = false;
      }
    });
  }

  handleConnect() {
    this.syncReceived = true;
  }

  handleSync(message) {
    this.syncReceived = true;

    // If a new round started
    if (message.round && message.storyline
      && (this.round !== message.round || this.playerApp.storylineId !== message.storyline)) {
      this.handleRoundChanged(message.round, message.storyline);
    }

    // Move the players
    Object.entries(message.players).forEach(([id, player]) => {
      if (id === this.playerApp.playerId) {
        if (!this.playerApp.hasPc()) {
          this.handleSessionStarted(player);
        }
      }
      if (id !== this.playerApp.playerId) {
        if (this.playerApp.remotePcs[id] === undefined) {
          this.handleRemotePcAdded(id);
        }
        if (player.position) {
          this.playerApp.remotePcs[id].setPosition(player.position.x, player.position.y);
        }
        if (player.speed) {
          this.playerApp.remotePcs[id].setSpeed(player.speed.x, player.speed.y);
        }
      }
    });

    // Remove players that were not included in the sync
    Object.keys(this.playerApp.remotePcs).forEach((id) => {
      if (message.players[id] === undefined) {
        this.handleRemotePcRemoved(id);
      }
    });

    // Sync the game state
    if (message.state) {
      this.roundState = message.state;
      this.playerApp.getStateHandler().onRoundState(message.state);
    }

    // Update the countdown
    if (message.roundCountdown) {
      const seconds = Math.ceil(message.roundCountdown / 1000);
      if (seconds < this.playerApp.roundTimer.getRemainingTime()) {
        this.playerApp.roundTimer.setRemainingTime(seconds);
      }
    }

    // Remove the PC if it was not included in the sync
    if (this.playerApp.hasPc() && message.players[this.playerApp.playerId] === undefined) {
      this.handleSessionEnded();
    }

    if (message.flags) {
      // Add all the flags from message.flags not present in playerApp.flags.flags
      Object.keys(message.flags).forEach((flag) => {
        if (!this.playerApp.flags.exists(flag)) {
          this.handleFlagSet(flag, message.flags[flag]);
        }
      });
    }
  }

  handleRoundChanged(round, storyline) {
    logger.info(`Round changed to ${round} (${storyline})`);
    if (this.round !== null) {
      this.playerApp.getStateHandler().onRoundEnd();
    }
    this.round = round;
    this.roundState = null;
    this.playerApp.setStoryline(storyline);
    this.playerApp.getStateHandler().onRoundStart();
  }

  handleSessionStarted(player) {
    logger.info('RX: session started');
    this.sessionActive = true;
    this.playerApp.addPc();
    this.playerApp.getPc().setPosition(player.position.x, player.position.y);
    this.playerApp.getStateHandler().onSessionStart();
  }

  handleSessionEnded() {
    logger.info('RX: session ended');
    this.sessionActive = false;
    this.playerApp.removePc();
    this.playerApp.getStateHandler().onSessionEnd();
  }

  handleRemotePcAdded(id) {
    logger.info(`RX: Remote player added: ${id}`);
    this.playerApp.remotePcs[id] = new Character(id, this.playerApp.config.players[id]);
    this.playerApp.gameView.addRemotePcView(this.playerApp.remotePcs[id]);
  }

  handleRemotePcRemoved(id) {
    logger.info(`RX: Remote player removed: ${id}`);
    delete this.playerApp.remotePcs[id];
    this.playerApp.gameView.removeRemotePcView(id);
  }

  handleFlagSet(flag, value) {
    logger.info(`RX: Remote flag set: ${flag} = ${value}`);
    this.playerApp.flags.set(flag, value, 'remote');
  }

  startSession() {
    logger.info(`TX: start session ${this.playerApp.playerId}`);
    this.connector.addPlayer(this.playerApp.playerId);
  }

  endSession() {
    logger.info(`TX: end session ${this.playerApp.playerId}`);
    this.connector.removePlayer(this.playerApp.playerId);
  }

  isSessionActive() {
    return this.sessionActive;
  }

  playerReady() {
    // Prevent spamming the server with ready messages
    // we only send a ready message if the round state has changed since the last ready message,
    // or if the last ready message was sent more than 1 second ago.
    const currentTime = Date.now();
    if ((currentTime - this.lastReadyTime < 1000) && this.lastReadyRoundState === this.roundState) {
      return;
    }
    this.lastReadyTime = currentTime;
    this.lastReadyRoundState = this.roundState;
    logger.info(`TX: Player ready ${this.playerApp.playerId} (${this.roundState})`);
    this.connector.playerReady(this.roundState, this.playerApp.playerId);
  }

  // eslint-disable-next-line class-methods-use-this
  roundEnd() {
    // Do nothing
  }

  isRoundInProgress() {
    return this.roundState === ROUND_IN_PROGRESS;
  }

  isRoundCompleted() {
    return this.roundState === ROUND_COMPLETED;
  }
}

module.exports = GameServerController;
