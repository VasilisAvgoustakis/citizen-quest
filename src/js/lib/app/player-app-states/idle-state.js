const PlayerAppState = require('./player-app-state');
const { IDLE } = require('./states');

class PlayerAppIdleState extends PlayerAppState {
  constructor(playerApp) {
    super(playerApp);
    this.state = IDLE;
  }

  onEnter() {
    this.playerApp.playerOverlayMgr.showTitleScreen();
    this.playerApp.gameView.cameraFollowDemoDrone();
    this.playerApp.inputRouter.routeToMenus(this.playerApp);
  }

  onAction() {
    this.playerApp.playerStart();
  }

  onExit() {
    this.playerApp.playerOverlayMgr.hideTitleScreen();
  }
}

module.exports = PlayerAppIdleState;
