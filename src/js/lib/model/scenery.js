class Scenery {
  constructor(id, props = {}) {
    this.id = id;
    this.type = props.type || this.id;
    this.position = { x: 0, y: 0 };
    this.speed = { x: 0, y: 0 };
    this.direction = 'e';

    if (props.spawn) {
      this.setPosition(props.spawn.x, props.spawn.y);
    }
    if (props.direction) {
      this.setDirection(props.direction);
    }

    if (props.cond) {
      this.cond = props.cond;
    }
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  setSpeed(x, y) {
    this.speed.x = x;
    this.speed.y = y;
  }

  setDirection(direction) {
    this.direction = direction;
  }
}

module.exports = Scenery;
