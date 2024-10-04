const PlayerAppState = require('./player-app-state');
const {
  INTRO, PLAYING, ENDING, RESET,
} = require('./states');

class PlayerAppIntroState extends PlayerAppState {
  constructor(playerApp) {
    super(playerApp);
    this.state = INTRO;

    this.pressedToStart = false;
    this.timedOut = false;
  }

  onEnter() {
    super.onEnter();
    this.playerApp.gameView.cameraStop();
    this.playerApp.inputRouter.routeToMenus(this.playerApp);
    const introText = this.playerApp.questTracker.activeStoryline.prompt;
    const inclusions = this.playerApp.questTracker.getActiveFlags('inc.');
    this.playerApp.playerOverlayMgr.showIntroScreen(introText, inclusions);
    if (this.playerApp.config?.game?.introTimeout) {
      this.playerApp.setStateTimeout(this.playerApp.config.game.introTimeout * 1000);
    }
  }

  onExit() {
    super.onExit();
    this.playerApp.playerOverlayMgr.hideIntroScreen();
  }

  onAction() {
    super.onAction();
    // If the intro text has not been revealed, the action button will reveal it.
    // Otherwise, the player will be allowed to start
    if (this.playerApp.playerOverlayMgr?.introScreen?.revealStarted) {
      if (!this.playerApp.playerOverlayMgr.introScreen.isTextRevealed()) {
        this.playerApp.playerOverlayMgr.introScreen.revealText();
      } else {
        // Play can begin if the round started and the button has been pressed
        this.pressedToStart = true;
        if (this.playerApp.isRoundInProgress()) {
          this.playerApp.setState(PLAYING);
        } else {
          this.playerApp.playerReady();
        }
      }
    }
  }

  onRoundState(state) {
    super.onRoundState(state);
    if (this.playerApp.isRoundCompleted()) {
      this.playerApp.setState(ENDING);
      return;
    }
    if (this.playerApp.isRoundInProgress() && (this.pressedToStart || this.timedOut)) {
      this.playerApp.setState(PLAYING);
    }
  }

  onSessionEnd() {
    super.onSessionEnd();
    this.playerApp.setState(ENDING);
  }

  onRoundEnd() {
    super.onRoundEnd();
    this.playerApp.setState(ENDING);
  }

  onTimeout() {
    super.onTimeout();
    this.timedOut = true;
    if (this.playerApp.isRoundInProgress()) {
      this.playerApp.setState(PLAYING);
    }
  }
}

module.exports = PlayerAppIntroState;
