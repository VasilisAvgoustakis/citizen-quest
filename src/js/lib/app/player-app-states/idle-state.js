const logger = require('loglevel');
const PlayerAppState = require('./player-app-state');
const {
  IDLE, QUEUED, INTRO, ENDING
} = require('./states');

class PlayerAppIdleState extends PlayerAppState {
  constructor(playerApp) {
    super(playerApp);
    this.state = IDLE;
  }

  onEnter() {
    super.onEnter();
    if (this.playerApp.hasPc()) {
      if (!this.playerApp.isRoundCompleted()) {
        logger.warn('Entered Idle state with PC. Moving to INTRO state.');
        this.playerApp.setState(INTRO);
      } else {
        logger.warn('Entered Idle state with PC. Moving to ENDING state.');
        this.playerApp.setState(ENDING);
      }
    }
    this.playerApp.playerOverlayMgr.showTitleScreen();
    this.playerApp.gameView.cameraFollowDemoDrone();
    this.playerApp.inputRouter.routeToMenus(this.playerApp);
  }

  onAction() {
    super.onAction();
    this.playerApp.startSession();
    this.playerApp.setState(QUEUED);
  }

  onExit() {
    super.onExit();
    this.playerApp.playerOverlayMgr.hideTitleScreen();
  }
}

module.exports = PlayerAppIdleState;
