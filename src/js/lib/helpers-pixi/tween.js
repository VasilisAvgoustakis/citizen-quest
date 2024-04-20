/* globals PIXI, TWEEN */

class PixiTween {
  constructor(userOptions) {
    const defaultOptions = {
      from: 0,
      to: 1,
      duration: 1000,
      delay: 0,
      easing: TWEEN.Easing.Sinusoidal.InOut,
      onUpdate: () => {},
      onComplete: null,
      repeat: 0,
      yoyo: false,
    };

    this.options = { ...defaultOptions, ...userOptions };

    this.tweenTicker = this.tweenTicker.bind(this);
    this.elapsed = 0;

    this.tween = new TWEEN.Tween({ value: this.options.from })
      .to({ value: this.options.to }, this.options.duration)
      .easing(this.options.easing)
      .onUpdate(this.options.onUpdate)
      .repeat(this.options.repeat)
      .yoyo(this.options.yoyo)
      .start(this.options.delay);

    PIXI.Ticker.shared.add(this.tweenTicker);
    this.tween.onComplete(this.onComplete.bind(this));
  }

  destroy() {
    this.tween.stop();
    PIXI.Ticker.shared.remove(this.tweenTicker);
  }

  stop() {
    this.tween.stop();
    this.onComplete();
  }

  onComplete() {
    PIXI.Ticker.shared.remove(this.tweenTicker);
    if (this.options.onComplete) {
      this.options.onComplete();
    }
  }

  tweenTicker(time) {
    this.elapsed += Math.ceil(time / PIXI.settings.TARGET_FPMS);
    this.tween.update(this.elapsed);
  }
}

PixiTween.Easing = TWEEN.Easing;

PixiTween.popOut = (displayObject, onComplete = null) => new PixiTween({
  from: Math.max(displayObject.scale.x, 0),
  tween: TWEEN.Easing.Elastic.Out,
  onUpdate: (o) => {
    displayObject.scale = { x: o.value, y: o.value };
  },
  onComplete,
});

PixiTween.popIn = (displayObject, onComplete = null) => new PixiTween({
  from: Math.min(displayObject.scale.x, 1),
  to: 0,
  tween: TWEEN.Easing.Elastic.Out,
  onUpdate: (o) => {
    displayObject.scale = { x: o.value, y: o.value };
  },
  onComplete,
});

PixiTween.Popper = (displayObject) => {
  let tween = null;
  return {
    show: (onComplete = null) => {
      if (tween) {
        tween.stop();
      }
      displayObject.visible = true;
      tween = PixiTween.popOut(displayObject, onComplete);
    },
    hide: (onComplete = null) => {
      if (tween) {
        tween.stop();
      }
      tween = PixiTween.popIn(displayObject, () => {
        displayObject.visible = false;
        if (onComplete) {
          onComplete();
        }
      });
    },
    stop: () => {
      if (tween) {
        tween.stop();
      }
    },
    destroy: () => {
      if (tween) {
        tween.destroy();
      }
    },
  };
};

PixiTween.Yoyo = (displayObject, direction, start, end, speed = 1) => new PixiTween({
  from: start,
  to: end,
  duration: 400 * speed,
  repeat: Infinity,
  yoyo: true,
  tween: TWEEN.Easing.Elastic.Out,
  onUpdate: (o) => {
    displayObject.position = {
      x: direction.x * o.value,
      y: direction.y * o.value,
    };
  },
});

PixiTween.Pulse = (displayObject, speed = 1) => new PixiTween({
  from: 0,
  to: 1,
  duration: 400 * speed,
  repeat: Infinity,
  yoyo: true,
  tween: TWEEN.Easing.Cubic.InOut,
  onUpdate: (o) => {
    displayObject.alpha = o.value;
  },
});

module.exports = PixiTween;
