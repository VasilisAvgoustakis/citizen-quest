/* globals PIXI */
const EventEmitter = require('events');

const SPEED_CAP = 1000 / 10;

class Drone {
  constructor(options, x = 0, y = 0) {
    this.options = { ...Drone.defaultOptions, ...options };
    this.x = x;
    this.y = y;
    this.width = 0;
    this.height = 0;
    this.speed = 0;
    this.pauseCounter = 0;
    this.targets = [];
    this.currentTargetIndex = 0;
    this.reachedAllTargets = true;
    this.events = new EventEmitter();
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setTargets(targets) {
    this.targets = targets;
    this.currentTargetIndex = 0;
    this.reachedAllTargets = false;
  }

  onReachedTarget() {
    this.events.emit('reachedTarget', this.currentTargetIndex);
    this.speed = 0;
    this.currentTargetIndex += 1;
    if (this.currentTargetIndex === this.targets.length) {
      this.reachedAllTargets = true;
      this.events.emit('reachedAllTargets');
    } else {
      this.pauseCounter = this.options.pauseBetweenTargets;
    }
  }

  stop() {
    this.speed = 0;
    this.pauseCounter = 0;
    this.targets = [];
    this.reachedAllTargets = true;
  }

  animate(time) {
    if (this.reachedAllTargets === true || this.targets.length === 0) {
      return;
    }

    const deltaMS = Math.min(time / PIXI.settings.TARGET_FPMS, SPEED_CAP);
    if (this.pauseCounter > 0) {
      this.pauseCounter = Math.max(0, this.pauseCounter - deltaMS);
    }

    if (this.pauseCounter === 0) {
      const target = this.targets[this.currentTargetIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > this.options.minSpeed * deltaMS) {
        const targetSpeed = Math.max(
          this.options.minSpeed,
          this.options.maxSpeed * Math.min(1, distance / this.options.slowDownDistance)
        );
        this.speed += (Math.sign(targetSpeed - this.speed)
          * this.options.accelerationFactor * deltaMS);
        this.x += (dx / distance) * this.speed * deltaMS;
        this.y += (dy / distance) * this.speed * deltaMS;
      } else {
        this.onReachedTarget();
      }
    }
  }
}

Drone.defaultOptions = {
  pauseBetweenTargets: 1000,
  minSpeed: 0.1,
  maxSpeed: 0.5,
  accelerationFactor: 0.01,
  slowDownDistance: 400,
};

module.exports = Drone;
