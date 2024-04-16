/* globals PIXI */

const MarionetteView = require('./marionette-view');

class CharEditView {
  constructor(config, textures, pixiApp, width, height) {
    this.config = config;
    this.textures = textures;
    this.pixiApp = pixiApp;

    this.display = new PIXI.Container();

    this.marionette = new MarionetteView(this.textures);
    this.display.addChild(this.marionette.getDisplay());
    this.marionette.getDisplay().position.set(width / 2, height * 0.8);
  }

  getDisplay() {
    return this.display;
  }

  setAction(action, x, y) {
    this.marionette.setAction(action, x, y);
  }
}

module.exports = CharEditView;
