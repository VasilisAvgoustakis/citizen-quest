const PlayerAppState = require('./player-app-state');
const { IDLE, RESET } = require('./states');

class PlayerAppResetState extends PlayerAppState {
  constructor(playerApp) {
    super(playerApp);
    this.state = RESET;
    this.checkedSession = false;
  }

  onEnter() {
    super.onEnter();
    this.showWaitingToEndScreen();
    this.playerApp.gameView.cameraStop();
  }

  onExit() {
    super.onExit();
    this.playerApp.playerOverlayMgr.hideTextScreen();
  }

  onSessionStart() {
    super.onSessionStart();
    this.playerApp.endSession();
  }

  onSessionEnd() {
    super.onSessionEnd();
    this.playerApp.setState(IDLE);
  }

  onRoundState(state) {
    super.onRoundState(state);
    // On first starting the app, it's possible the server has a stale session.
    // We wait until this handler is called (which happens on a sync message)
    // and check whether a session exists. Otherwise, we can proceed to IDLE.
    if (!this.checkedSession) {
      this.checkedSession = true;
      if (this.playerApp.isSessionActive()) {
        this.playerApp.endSession();
      } else {
        this.playerApp.setState(IDLE);
      }
    }
  }

  showWaitingToEndScreen() {
    this.playerApp.playerOverlayMgr.showTextScreen(
      this.playerApp.config.i18n.ui.waitingToEnd
    );
  }
}

module.exports = PlayerAppResetState;
