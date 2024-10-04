const PlayerAppState = require('./player-app-state');
const { QUEUED, INTRO } = require('./states');

class PlayerAppQueuedState extends PlayerAppState {
  constructor(playerApp) {
    super(playerApp);
    this.state = QUEUED;
  }

  onEnter() {
    super.onEnter();
    this.playerApp.gameView.cameraStop();
    this.playerApp.inputRouter.routeToMenus(this.playerApp);
    if (this.playerApp.isRoundCompleted()) {
      this.showWaitingToBeginScreen();
    } else if (this.playerApp.hasPc()) {
      this.playerApp.setState(INTRO);
    }
  }

  onSessionStart() {
    super.onSessionStart();
    this.playerApp.setState(INTRO);
  }

  showWaitingToBeginScreen() {
    this.playerApp.playerOverlayMgr.showTextScreen(
      this.playerApp.config.i18n.ui.waitingToBegin
    );
  }

  onExit(toState) {
    super.onExit(toState);
    this.playerApp.playerOverlayMgr.hideTextScreen();
  }
}

module.exports = PlayerAppQueuedState;
