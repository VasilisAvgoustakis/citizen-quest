const PlayerAppState = require('./player-app-state');
const { PLAYING, ENDING } = require('./states');

class PlayerAppPlayingState extends PlayerAppState {
  constructor(playerApp) {
    super(playerApp);
    this.state = PLAYING;
  }

  onEnter() {
    super.onEnter();
    this.playerApp.gameView.cameraFollowPc();
    this.playerApp.showNpcMoods();
    this.playerApp.inputRouter.routeToPcMovement(this.playerApp);
    this.playerApp.roundTimer.start();
    this.playerApp.playerOverlayMgr.countdown.show();
    this.playerApp.playerOverlayMgr.showDefaultPrompt();
  }

  onExit() {
    super.onExit();
    this.playerApp.dialogueSequencer.terminate();
    this.playerApp.hideNpcMoods();
    this.playerApp.playerOverlayMgr.questOverlay.hide();
    this.playerApp.playerOverlayMgr.countdown.hide();
  }

  onRoundState() {
    super.onRoundState();
    if (!this.playerApp.isRoundInProgress()) {
      this.playerApp.setState(ENDING);
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
}

module.exports = PlayerAppPlayingState;
