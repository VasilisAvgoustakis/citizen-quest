const DialogueSequencerState = require('./dialogue-sequencer-state');
const DialogueEffect = require('../effects/dialogue-effect');

class DialogueSequencerEffectState extends DialogueSequencerState {
  constructor(dialogueSequencer) {
    super(dialogueSequencer);
    this.handleEffectStartComplete = this.handleEffectStartComplete.bind(this);
    this.handleEffectEndComplete = this.handleEffectEndComplete.bind(this);
    this.effectType = typeof this.activeNode.effect === 'string'
      ? this.activeNode.effect : this.activeNode.effect.type;
    this.effectOptions = typeof this.activeNode.effect === 'string'
      ? {} : this.activeNode.effect.options || {};
    this.effectPhase = this.activeNode.effect?.phase || 'all';
    this.effect = null;
  }

  onBegin() {
    if (this.effectPhase === 'end') {
      this.dialogueSequencer.endActiveEffect(this.effectType, this.handleEffectEndComplete);
    } else {
      this.effect = this.dialogueSequencer.createEffect(this.effectType, this.effectOptions);
      this.effect.start(this.handleEffectStartComplete);
    }
  }

  onAction() {
    if (this.effect
      && this.effect.state !== DialogueEffect.States.IDLE
      && this.effect.state !== DialogueEffect.States.FINISHED) {
      this.effect.handleActionButton();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  onEnd() {
    // Nothing to do
  }

  handleEffectStartComplete() {
    if (this.effectPhase === 'all') {
      this.effect.end(this.handleEffectEndComplete);
    } else if (this.effectPhase === 'start') {
      this.dialogueSequencer.endUi();
    }
  }

  handleEffectEndComplete() {
    this.dialogueSequencer.terminateEffect(this.effectType);
    this.dialogueSequencer.endUi();
  }
}

module.exports = DialogueSequencerEffectState;
