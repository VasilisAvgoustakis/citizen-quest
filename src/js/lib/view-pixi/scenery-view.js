/* globals PIXI */

class SceneryView {
  constructor(config, textures, scenery, townView) {
    this.config = config;
    this.textures = textures;
    this.scenery = scenery;
    this.townView = townView;
    this.display = this.createSprite();
  }

  createSprite() {
    const sprite = new PIXI.Sprite(this.textures[this.scenery.type]);
    sprite.anchor.set(0.5, 1);

    sprite.position = this.scenery.position;
    sprite.zIndex = sprite.position.y;

    return sprite;
  }

  destroy() {
    this.display.removeFromParent();
    this.display.destroy();
  }
}

module.exports = SceneryView;
