/* globals PIXI */
const { Popper } = require('../helpers-pixi/tween');

class MapMarker {
  constructor(texture, contentTexture, anchor = null) {
    this.destroyed = false;
    this.display = new PIXI.Container();
    this.markerDisplay = new PIXI.Sprite(texture);
    this.display.addChild(this.markerDisplay);
    this.contentDisplay = new PIXI.Sprite(contentTexture);
    this.markerDisplay.addChild(this.contentDisplay);
    this.contentDisplay.anchor.set(0.5, 0.5);
    this.contentDisplay.position
      .set(0, -this.markerDisplay.height + this.contentDisplay.height / 2 - 1.5);
    this.markerDisplay.anchor.set(anchor ? anchor.x : 0, anchor ? anchor.y : 0);
    this.markerDisplay.visible = false;
    this.markerDisplay.scale = 0;
    this.popper = Popper(this.markerDisplay);
  }

  destroy() {
    this.destroyed = true;
    this.popper.destroy();
    this.display.destroy({ children: true });
  }

  setScale(scale) {
    if (!this.destroyed) {
      this.display.scale.set(scale, scale);
    }
  }

  setPosition(x, y) {
    if (!this.destroyed) {
      this.display.position.set(x, y);
    }
  }

  show(onComplete = null) {
    if (!this.destroyed) {
      this.popper.show(onComplete);
    }
  }

  hide(onComplete = null) {
    if (!this.destroyed) {
      this.popper.hide(onComplete);
    }
  }
}

module.exports = MapMarker;
