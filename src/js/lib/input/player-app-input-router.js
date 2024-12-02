const PcMovementConnection = require('./connections/pc-movement');
const DialogueOverlayConnection = require('./connections/dialogue-overlay');
const MenuConnection = require('./connections/menu');

class PlayerAppInputRouter {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.currentConnection = null;
  }

  setConnection(connection) {
    this.unroute();
    this.currentConnection = connection;
    this.currentConnection.route();
  }

  unroute() {
    if (this.currentConnection) {
      this.currentConnection.unroute();
      this.currentConnection = null;
    }
  }

  isRouted() {
    return this.currentConnection !== null;
  }

  routeToPcMovement(playerApp) {
    this.setConnection(new PcMovementConnection(this.inputManager, playerApp));
  }

  routeToDialogueOverlay(dialogueOverlay, dialogueSequencer) {
    this.setConnection(
      new DialogueOverlayConnection(this.inputManager, dialogueOverlay, dialogueSequencer)
    );
  }

  routeToMenus(playerApp) {
    this.setConnection(new MenuConnection(this.inputManager, playerApp));
  }

  routeToNone() {
    this.unroute();
  }
}

module.exports = PlayerAppInputRouter;
