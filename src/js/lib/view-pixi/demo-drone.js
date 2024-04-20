/* globals PIXI */

const { shuffleArray } = require('../helpers/shuffle');

const SPEED_CAP = 1000 / 10;

class DemoDrone {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
    this.wait = 0;
    this.targets = [];
    this.currentTargetIndex = 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setTargets(targets) {
    this.targets = targets;
    shuffleArray(this.targets);
    this.currentTargetIndex = 0;
  }

  onReachedTarget() {
    this.currentTargetIndex = (this.currentTargetIndex + 1) % this.targets.length;
    this.speed = 0;
    this.wait = 1000;
  }

  animate(time) {
    if (this.active === false || this.targets.length === 0) {
      return;
    }

    const deltaMS = Math.min(time / PIXI.settings.TARGET_FPMS, SPEED_CAP);
    if (this.wait > 0) {
      this.wait = Math.max(0, this.wait - deltaMS);
    }

    if (this.wait === 0) {
      const target = this.targets[this.currentTargetIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > DemoDrone.MIN_SPEED * deltaMS) {
        const targetSpeed = Math.max(
          DemoDrone.MIN_SPEED,
          DemoDrone.MAX_SPEED * Math.min(1, distance / 400)
        );
        this.speed += Math.sign(targetSpeed - this.speed) * 0.01;
        this.x += (dx / distance) * this.speed * deltaMS;
        this.y += (dy / distance) * this.speed * deltaMS;
      } else {
        this.onReachedTarget();
      }
    }
  }
}

DemoDrone.WAIT_TIME = 5000; // in ms
DemoDrone.MIN_SPEED = 0.1;
DemoDrone.MAX_SPEED = 0.5; // in pixels per ms

module.exports = DemoDrone;
