const { registerEffect } = require('./dialogue-effect-factory');
const DialogueEffect = require('./dialogue-effect');

class DialogueEffectImage extends DialogueEffect {
  constructor(app, options) {
    super(app, options);
    this.timeoutTimer = null;
  }

  onStarting(doneCallback) {
    const src = this.getSrcUrl(this.options.src);
    this.app.playerOverlayMgr.imageDisplayOverlay.showImage(src, {
      size: this.options.size,
      enterAnimationDuration: this.options.enterAnimationDuration,
    }).then(() => {
      this.timeoutTimer = setTimeout(() => {
        doneCallback();
      }, this.options.enterAnimationDuration + this.options.displayDuration);
    });
  }

  onEnding(doneCallback) {
    this.app.playerOverlayMgr.imageDisplayOverlay.hideImage(this.options.exitAnimationDuration);
    this.timeoutTimer = setTimeout(() => {
      doneCallback();
    }, this.options.exitAnimationDuration);
  }

  terminate() {
    clearTimeout(this.timeoutTimer);
    this.app.playerOverlayMgr.imageDisplayOverlay.clear();
    super.terminate();
  }

  getSrcUrl(src) {
    if (typeof src === 'string') {
      return this.app.getStorylineImageUrl(src);
    }
    if (typeof src === 'object') {
      return Object.fromEntries(
        Object.entries(src).map(([key, value]) => [key, this.app.getStorylineImageUrl(value)])
      );
    }
    throw new Error('Invalid src type');
  }

  // eslint-disable-next-line class-methods-use-this
  getDefaultOptions() {
    return {
      enterAnimationDuration: 1000,
      exitAnimationDuration: 1000,
      displayDuration: 3000,
      size: 'full',
    };
  }
}

registerEffect('image', DialogueEffectImage);

module.exports = DialogueEffectImage;
