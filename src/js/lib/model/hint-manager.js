const EventEmitter = require('events');

class HintManager {
  constructor(config) {
    this.config = config;
    this.events = new EventEmitter();

    this.hintDialogueThreshold = this.config?.game?.hintDialogueThreshold || 3;

    this.dialogueCounter = new Set();
  }

  handleDialogue(npcId) {
    // If the threshold is 0, the dialogue counter is disabled
    if (this.hintDialogueThreshold === 0) {
      return;
    }

    this.dialogueCounter.add(npcId);
    if (this.dialogueCounter.size >= this.hintDialogueThreshold) {
      this.events.emit('hintNeeded');
      this.reset();
    }
  }

  reset() {
    this.events.emit('reset');
    this.dialogueCounter.clear();
  }
}

module.exports = HintManager;
