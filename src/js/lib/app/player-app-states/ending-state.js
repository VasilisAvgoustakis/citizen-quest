const PlayerAppState = require('./player-app-state');
const { ENDING, RESET } = require('./states');

class PlayerAppEndingState extends PlayerAppState {
  constructor(playerApp) {
    super(playerApp);
    this.state = ENDING;
  }

  onEnter(fromState) {
    super.onEnter(fromState);
    this.playerApp.gameView.cameraStop();
    this.playerApp.inputRouter.routeToMenus(this.playerApp);
    const [endingText, classes] = this.playerApp.getCurrentEnding();
    const inclusions = this.playerApp.questTracker.getActiveFlags('inc.');
    this.playerApp.playerOverlayMgr.showEndingScreen(endingText, classes, inclusions);
    if (this.playerApp.config?.game?.endingTimeout) {
      this.playerApp.setStateTimeout(this.playerApp.config.game.endingTimeout * 1000);
    }
  }

  onExit() {
    super.onExit();
    this.playerApp.playerOverlayMgr.hideEndingScreen();
  }

  onAction() {
    super.onAction();
    // If the ending text has not been revealed, the action button will reveal it.
    // Otherwise, the player will be allowed to end.
    if (this.playerApp.playerOverlayMgr?.endingScreen?.revealStarted) {
      if (!this.playerApp.playerOverlayMgr.endingScreen.isTextRevealed()) {
        this.playerApp.playerOverlayMgr.endingScreen.revealText();
      } else {
        if (this.playerApp.isRoundCompleted()) {
          this.playerApp.playerReady();
        }
        this.playerApp.setState(RESET);
      }
    }
  }

  onTimeout() {
    super.onTimeout();
    this.playerApp.setState(RESET);
  }
}

module.exports = PlayerAppEndingState;
