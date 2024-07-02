const { registerEffect } = require('./dialogue-effect-factory');
const DialogueEffect = require('./dialogue-effect');

class DialogueEffectPanNZoom extends DialogueEffect {
  constructor(app, options) {
    super(app, options);
    this.storeCameraPreset();
    this.drone = null;
    this.displayTimer = null;
  }

  storeCameraPreset() {
    this.savedPreset = this.app.gameView.cameraPreset;
    this.savedTarget = this.app.gameView.camera.getTarget();
    this.hasReset = false;
  }

  restoreCameraPreset(instant = false) {
    if (!this.hasReset) {
      this.hasReset = true;
      this.app.gameView.camera.setTarget(this.savedTarget);
      this.app.gameView.cameraUsePreset(this.savedPreset, instant);
    }
  }

  getTargetCoordinates() {
    if (this.options.targetType === 'npc') {
      const npcView = this.app.gameView.getNpcView(this.options.target);
      return npcView.character.position;
    }
    if (this.options.targetType === 'scenery') {
      const sceneryView = this.app.gameView.getSceneryView(this.options.target);
      return sceneryView.scenery.position;
    }
    if (typeof this.options.target === 'object' && this.options.target.x && this.options.target.y) {
      return this.options.target;
    }
    throw new Error('Invalid target type');
  }

  onStarting(doneCallback) {
    const targetCoordinates = this.getTargetCoordinates();
    const startPosition = this.app.gameView.camera.getTarget().position;
    this.drone = this.app.gameView.createDrone({
      minSpeed: this.options.minSpeed,
      maxSpeed: this.options.maxSpeed,
      accelerationFactor: this.options.accelerationFactor,
      slowDownDistance: this.options.slowDownDistance,
    }, startPosition.x, startPosition.y);
    this.drone.setTargets([targetCoordinates]);
    this.drone.events.once('reachedAllTargets', () => {
      this.displayTimer = setTimeout(() => {
        doneCallback();
      }, this.options.displayDuration);
    });
    this.app.gameView.cameraUsePreset({
      offset: this.options.targetOffset,
      zoom: this.options.zoom,
    });
    this.app.gameView.camera.setTarget(this.drone);
  }

  onEnding(doneCallback) {
    this.displayTimer = setTimeout(() => {
      this.drone.setTargets([{ x: this.savedTarget.x, y: this.savedTarget.y }]);
      this.drone.events.once('reachedAllTargets', () => {
        this.restoreCameraPreset();
        doneCallback();
      });
    }, this.options.displayEndDuration);
  }

  terminate() {
    clearTimeout(this.displayTimer);
    this.restoreCameraPreset(true);
  }

  // eslint-disable-next-line class-methods-use-this
  getDefaultOptions() {
    return {
      targetType: 'npc',
      targetOffset: { x: 0, y: 0 },
      zoom: 0.75,
      maxSpeed: 1,
      minSpeed: 0.1,
      accelerationFactor: 0.01,
      slowDownDistance: 400,
      displayDuration: 3000,
      displayEndDuration: 0,
    };
  }
}

registerEffect('pan-n-zoom', DialogueEffectPanNZoom);

module.exports = DialogueEffectPanNZoom;
