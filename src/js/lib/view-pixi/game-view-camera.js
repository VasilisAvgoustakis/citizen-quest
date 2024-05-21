/* globals PIXI */

const PixiTween = require('../helpers-pixi/tween');

/**
 * A camera offers a viewport that crops, pans and zooms across a child display object.
 */
class GameViewCamera {
  /**
   * @param {PIXI.DisplayObject} child
   *  The display object to be cropped, panned and zoomed.
   * @param {Number} viewportWidth
   *  The width of the viewport (the view that the camera offers).
   * @param {Number} viewportHeight
   *  The height of the viewport (the view that the camera offers).
   */
  constructor(child, viewportWidth, viewportHeight) {
    this.child = child;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.display = new PIXI.Container();
    this.display.addChild(this.child);
    this.target = null;
    this.offset = new PIXI.Point(0, 0);
    this.zoom = 1;
  }

  /**
   * Set the target of the camera.
   *
   * @param {PIXI.DisplayObject} target
   *  An object within the child that the camera should follow.
   */
  setTarget(target) {
    this.target = target;
  }

  getTarget() {
    return this.target;
  }

  getPosition() {
    return this.display.position;
  }

  setRelativeOffset(xFactor, yFactor) {
    if (this.target.width && this.target.height) {
      this.offset = new PIXI.Point(this.target.width * xFactor, this.target.height * yFactor);
    } else {
      this.offset = new PIXI.Point(0, 0);
    }
  }

  relativeOffsetTo(xFactor, yFactor, duration = 500) {
    if (this.offsetTween) {
      this.offsetTween.destroy();
    }

    this.offsetTween = new PixiTween({
      from: { x: this.offset.x, y: this.offset.y },
      to: { x: this.target.width * xFactor, y: this.target.height * yFactor },
      duration,
      easing: PixiTween.Easing.Sinusoidal.InOut,
      onUpdate: (o) => {
        this.offset = new PIXI.Point(o.value.x, o.value.y);
      },
    });
  }

  setZoom(zoom) {
    this.display.scale.set(zoom);
  }

  zoomTo(zoom, duration = 500) {
    if (this.zoomTween) {
      this.zoomTween.destroy();
    }
    this.zoomTween = new PixiTween({
      from: this.getZoom(),
      to: zoom,
      duration,
      easing: PixiTween.Easing.Sinusoidal.InOut,
      onUpdate: (o) => {
        this.setZoom(o.value);
      },
    });
  }

  getZoom() {
    return this.display.scale.x;
  }

  /**
   * Update the camera.
   *
   * This should be called every frame. It will update the camera's pivot point to follow
   * the target.
   */
  update() {
    if (this.target) {
      // Set the pivot but maintain the camera within the bounds of the view
      this.display.pivot.set(
        Math.max(
          0,
          Math.min(
            this.target.x + this.offset.x - this.viewportWidth / 2 / this.display.scale.x,
            this.child.width - this.viewportWidth / this.display.scale.x
          )
        ),
        Math.max(
          0,
          Math.min(
            this.target.y + this.offset.y - this.viewportHeight / 2 / this.display.scale.y,
            this.child.height - this.viewportHeight / this.display.scale.y
          )
        )
      );
    }
  }
}

module.exports = GameViewCamera;
