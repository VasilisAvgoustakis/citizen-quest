/* eslint-disable class-methods-use-this,no-unused-vars */
class PlayerAppState {
  constructor(playerApp) {
    this.playerApp = playerApp;
    this.state = null;
  }

  onEnter(fromState) { }

  onExit(toState) { }

  onRoundState(state) { }

  onSessionStart() { }

  onSessionEnd() { }

  onRoundStart() { }

  onRoundEnd() { }

  onAction() { }

  onTimeout() { }
}

module.exports = PlayerAppState;
