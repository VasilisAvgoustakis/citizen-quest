const logger = require('loglevel');
const PlayerAppStates = require('./player-app-states/states');
const StorylineManager = require('../model/storyline-manager');

class LocalGameServerController {
  constructor(config, playerApp) {
    this.config = config;
    this.playerApp = playerApp;
    this.round = 0;
    this.roundInProgress = false;
    this.storylineManager = new StorylineManager(config);
    this.lastStoryline = null;
    this.sessionActive = false;
    this.handleRoundChanged();
    this.playerApp.setState(PlayerAppStates.RESET);
    this.playerApp.setState(PlayerAppStates.IDLE);
  }

  roundEnd() {
    logger.info('Local: Round end');
    this.roundInProgress = false;
    this.playerApp.setState(PlayerAppStates.ENDING);
  }

  isRoundInProgress() {
    return this.roundInProgress;
  }

  // eslint-disable-next-line class-methods-use-this
  isRoundCompleted() {
    return !this.roundInProgress;
  }

  startSession() {
    if (!this.sessionActive) {
      this.handleSessionStarted();
    }
  }

  endSession() {
    if (this.sessionActive) {
      this.handleSessionEnded();
    }
  }

  isSessionActive() {
    return this.sessionActive;
  }

  playerReady() {
    logger.info(`Local: Player ready ${this.playerApp.playerId}`);
    if (this.playerApp.getState() === PlayerAppStates.ENDING) {
      // Dirty transition, but server stage management needs more work
      setTimeout(() => {
        this.handleSessionEnded();
      }, 0);
    }
  }

  handleRoundChanged() {
    if (this.round !== 0) {
      this.playerApp.getStateHandler().onRoundEnd();
    }
    this.round += 1;
    this.playerApp.setStoryline(this.getNextStoryline());
    this.roundInProgress = false;
    logger.info(`Round changed to ${this.round} (${this.lastStoryline})`);

    this.playerApp.getStateHandler()?.onRoundStart();
  }

  handleSessionStarted() {
    logger.info('Local: session started');
    this.sessionActive = true;
    this.roundInProgress = true;
    this.playerApp.addPc();
    this.playerApp.getStateHandler().onSessionStart();
  }

  handleSessionEnded() {
    logger.info('Local: session ended');
    this.sessionActive = false;
    this.playerApp.removePc();
    this.playerApp.getStateHandler().onSessionEnd();
    this.handleRoundChanged();
  }

  getNextStoryline() {
    this.lastStoryline = (this.lastStoryline === null)
      ? this.storylineManager.getFirst()
      : this.storylineManager.getNext(this.lastStoryline);
    return this.lastStoryline;
  }
}

module.exports = LocalGameServerController;
