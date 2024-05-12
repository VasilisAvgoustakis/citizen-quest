/* globals PIXI */

const Fader = require('../helpers-pixi/fader');

class SceneryView {
  constructor(config, textures, scenery, townView) {
    this.config = config;
    this.textures = textures;
    this.scenery = scenery;
    this.townView = townView;
    this.display = this.createSprite();
    this.fader = new Fader(this.display);
    this.visible = true;
  }

  createSprite() {
    const sprite = new PIXI.Sprite(this.textures[this.scenery.type]);
    sprite.anchor.set(0.5, 1);

    sprite.position = this.scenery.position;
    sprite.zIndex = this.scenery.zIndex ?? sprite.position.y;

    return sprite;
  }

  destroy() {
    this.display.removeFromParent();
    this.display.destroy();
  }

  show() {
    this.fader.fadeIn(1000);
    this.visible = true;
  }

  hide() {
    this.fader.fadeOut(1000);
    this.visible = false;
  }

  isVisible() {
    return this.visible;
  }
}

module.exports = SceneryView;
