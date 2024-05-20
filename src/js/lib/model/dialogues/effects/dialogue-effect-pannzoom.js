const { registerEffect } = require('./dialogue-effect-factory');
const DialogueEffect = require('./dialogue-effect');

class DialogueEffectPanNZoom extends DialogueEffect {
  constructor(data) {
    super(data);
  }
}

registerEffect('pan-n-zoom', DialogueEffectPanNZoom);

module.exports = DialogueEffectPanNZoom;
