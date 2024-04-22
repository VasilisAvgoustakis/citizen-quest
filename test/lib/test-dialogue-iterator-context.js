const DialogueIteratorContext = require('../../src/js/lib/model/dialogues/dialogue-iterator-context');
const FlagStore = require('../../src/js/lib/model/flag-store');

class TestDialogueIteratorContext extends DialogueIteratorContext {
  constructor() {
    super(new FlagStore());
    this.randomValues = [];
  }

  setRandom(random) {
    this.randomValues = random;
  }

  random() {
    if (this.randomValues.length === 0) {
      throw new Error('Not enough random values set');
    }
    return this.randomValues.shift();
  }
}

module.exports = TestDialogueIteratorContext;
