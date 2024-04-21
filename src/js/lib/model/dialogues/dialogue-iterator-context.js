class DialogueIteratorContext {
  constructor(flags) {
    this.flags = flags;
    this.cycleIds = {};
  }

  clearState() {
    this.cycleIds = {};
  }

  // eslint-disable-next-line class-methods-use-this
  random(max) {
    return Math.floor(Math.random() * max);
  }

  getLastCycleId(nodeId) {
    return this.cycleIds[nodeId] || null;
  }

  setLastCycleId(nodeId, itemId) {
    this.cycleIds[nodeId] = itemId;
  }
}

module.exports = DialogueIteratorContext;
