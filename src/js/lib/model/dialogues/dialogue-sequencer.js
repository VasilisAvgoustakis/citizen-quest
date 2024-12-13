const EventEmitter = require('events');
const DialogueIterator = require('./dialogue-iterator');
const DialogueSequencerTextState = require('./dialogue-sequencer-states/text-state');
const DialogueSequencerEffectState = require('./dialogue-sequencer-states/effect-state');

class DialogueSequencer {
  constructor(dialogueEffectFactory, dialogueOverlay) {
    this.dialogueEffectFactory = dialogueEffectFactory;
    this.dialogueOverlay = dialogueOverlay;
    this.dialogue = null;
    this.dialogueIterator = null;
    this.uiState = null;
    this.activeEffects = {};

    this.events = new EventEmitter();
  }

  setUiState(state) {
    if (this.uiState) {
      this.uiState.onEnd();
    }
    this.uiState = state;
    if (this.uiState) {
      this.uiState.onBegin();
    }
  }

  endUi(responseId = null) {
    this.uiState = null;
    if (responseId !== null) {
      this.dialogueIterator.nextWithResponse(responseId);
    } else {
      this.dialogueIterator.next();
    }
    this.runUntilInteractivity();
  }

  play(dialogue, context, options) {
    this.dialogue = dialogue;
    this.dialogueOverlay.setTopTitle(options.top || null);
    this.dialogueIterator = new DialogueIterator(dialogue, context);
    this.runUntilInteractivity();
  }

  runUntilInteractivity() {
    const { dialogueIterator } = this;

    if (!this.handledByUI(dialogueIterator.getActiveNode())) {
      do {
        dialogueIterator.next();
      } while (!dialogueIterator.isEnd() && !this.handledByUI(dialogueIterator.getActiveNode()));
    }

    if (this.handledByUI(dialogueIterator.getActiveNode())) {
      const nodeType = dialogueIterator.getActiveNode().type;
      if (nodeType === 'statement') {
        this.setUiState(new DialogueSequencerTextState(this));
      } else if (nodeType === 'effect') {
        this.setUiState(new DialogueSequencerEffectState(this));
      }
    } else {
      this.onDialogueEnd();
    }
  }

  onDialogueEnd() {
    this.events.emit('end');
    this.terminate();
  }

  action() {
    if (this.uiState) {
      this.uiState.onAction();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handledByUI(node) {
    return node && (node.type === 'statement' || node.type === 'effect');
  }

  createEffect(effectType, effectOptions) {
    this.terminateEffect(effectType);
    this.activeEffects[effectType] = this.dialogueEffectFactory
      .createEffect(effectType, effectOptions);
    return this.activeEffects[effectType];
  }

  endActiveEffect(effectType, endDoneCallback) {
    if (this.activeEffects[effectType]) {
      this.activeEffects[effectType].end(endDoneCallback);
    } else {
      endDoneCallback();
    }
  }

  terminateEffect(effectType) {
    if (this.activeEffects[effectType]) {
      this.activeEffects[effectType].terminate();
    }
    delete this.activeEffects[effectType];
  }

  terminateAllEffects() {
    Object.keys(this.activeEffects).forEach((effectType) => {
      this.activeEffects[effectType].terminate();
    });
    this.activeEffects = {};
  }

  terminate() {
    this.events.emit('terminate');
    this.terminateAllEffects();
    this.setUiState(null);
    this.dialogueOverlay.hide();
    this.dialogueIterator = null;
    this.dialogue = null;
  }
}

module.exports = DialogueSequencer;
