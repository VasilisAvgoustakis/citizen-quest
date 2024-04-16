/* globals PIXI */

const HIP_OFFSET = -6;
const NECK_OFFSET = 2;
const SHOULDER_OFFSET_Y = -15;
const SHOULDER_OFFSET_X = -3;
const SHOULDER_SIDE_FRONT_OFFSET = 12;
const SHOULDER_SIDE_BACK_OFFSET = 8;

const BOBBING_FACTOR = [0, -1, 0, 1, 0, -1, 0, 1];
const BOBBING_HEAD_OFFSET = 3;
const BOBBING_TORSO_OFFSET = 2;

class MarionetteView {
  constructor(textures) {
    this.textures = textures['sprites-char'].textures;
    this.animations = textures['sprites-char'].animations;
    this.initAnimations();

    this.display = new PIXI.Container();
    this.currentAction = 's';
    this.currentDirection = 's';

    const legsHeight = this.textures['legs-fro-q'].height;
    const torsoHeight = this.textures['torso-yellow'].height;
    const torsoWidth = this.textures['torso-yellow'].width;

    this.metrics = {
      hips: legsHeight + HIP_OFFSET,
      shoulders: {
        x: torsoWidth / 2 + SHOULDER_OFFSET_X,
        y: legsHeight + HIP_OFFSET + torsoHeight + SHOULDER_OFFSET_Y,
      },
      neck: legsHeight + HIP_OFFSET + torsoHeight + NECK_OFFSET,
    };

    this.shadow = new PIXI.AnimatedSprite([this.textures['shadow-char']]);
    this.shadow.anchor.set(0.5, 1);

    this.display.addChild(this.shadow);

    this.legs = new PIXI.AnimatedSprite([this.textures['legs-fro-q']]);
    this.legs.anchor.set(0.5, 1);
    this.legs.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.legs.onFrameChange = this.adjustBobbing.bind(this);
    this.display.addChild(this.legs);

    this.armRight = new PIXI.AnimatedSprite([this.textures['arm-fro-q']]);
    this.armRight.position.set(-this.metrics.shoulders.x, -this.metrics.shoulders.y);
    this.armRight.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.armRight.updateAnchor = true;
    this.display.addChild(this.armRight);

    this.torso = new PIXI.Sprite(this.textures['torso-yellow']);
    this.torso.anchor.set(0.5, 1);
    this.torso.position.set(0, -this.metrics.hips);
    this.torso.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.display.addChild(this.torso);

    this.armLeft = new PIXI.AnimatedSprite([this.textures['arm-fro-q']]);
    this.armLeft.position.set(this.metrics.shoulders.x, -this.metrics.shoulders.y);
    this.armLeft.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.armLeft.updateAnchor = true;
    this.armLeft.scale.x = -1;
    this.display.addChild(this.armLeft);
    // this.armLeft.visible = false;


    this.head = new PIXI.Sprite(this.textures['head-a']);
    this.head.anchor.set(0.5, 1);
    this.head.position.set(0, -this.metrics.neck);
    this.head.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.display.addChild(this.head);
  }

  initAnimations() {
    console.log(this.animations);
  }

  destroy() {
    this.display.destroy({ children: true });
  }

  getDisplay() {
    return this.display;
  }

  setAction(action, x, y) {
    const direction = this.getDirectionName(x, y);
    if (action === 's') {
      this.setStanding(direction);
    }
    if (action === 'w') {
      this.setWalking(direction);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getDirectionName(x, y) {
    if (y > 0) {
      return 'n';
    }
    if (y < 0) {
      return 's';
    }
    if (x > 0) {
      return 'e';
    }
    if (x < 0) {
      return 'w';
    }
    return 's';
  }

  // eslint-disable-next-line class-methods-use-this
  getArmId(plane, direction) {
    if (direction === 'n' || direction === 's') {
      return plane === 'b' ? 'l' : 'r';
    }
    return plane;
  }

  setStanding(direction) {
    this.currentAction = 's';
    this.currentDirection = direction;

    const facing = (direction === 'n' || direction === 's') ? 'fro' : 'lat';

    this.legs.textures = [this.textures[`legs-${facing}-q`]];
    this.legs.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.legs.stop();
    this.armRight.textures = [this.textures[`arm-${facing}-q`]];
    this.armRight.scale.x = (direction === 's' || direction === 'e') ? -1 : 1;
    this.armRight.stop();
    this.armLeft.textures = [this.textures[`arm-${facing}-q`]];
    this.armLeft.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.armLeft.stop();

    this.adjustArmsHPosition(direction);
  }

  setWalking(direction) {
    this.currentAction = 'w';
    this.currentDirection = direction;

    const facing = (direction === 'n' || direction === 's') ? 'fro' : 'lat';

    this.legs.textures = this.animations[`legs-${facing}-w`];
    this.legs.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.legs.play();

    this.armRight.textures = this.animations[`arm-${facing}-w`];
    this.armRight.scale.x = (direction === 's' || direction === 'e') ? -1 : 1;
    this.armLeft.textures = this.animations[`arm-${facing}-w`];
    this.armLeft.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.adjustArmsHPosition(direction);
    this.armLeft.play();
    this.armRight.gotoAndPlay(facing === 'fro' ? 4 : 0);
  }

  adjustArmsHPosition(direction) {
    if (direction === 'n') {
      this.armRight.position.x = -this.metrics.shoulders.x;
      this.armLeft.position.x = this.metrics.shoulders.x;
    }
    if (direction === 's') {
      this.armRight.position.x = this.metrics.shoulders.x;
      this.armLeft.position.x = -this.metrics.shoulders.x;
    }
    if (direction === 'e') {
      this.armLeft.position.x = -this.metrics.shoulders.x + SHOULDER_SIDE_FRONT_OFFSET;
      this.armRight.position.x = this.metrics.shoulders.x - SHOULDER_SIDE_BACK_OFFSET;
    }
    if (direction === 'w') {
      this.armLeft.position.x = this.metrics.shoulders.x - SHOULDER_SIDE_FRONT_OFFSET;
      this.armRight.position.x = -this.metrics.shoulders.x + SHOULDER_SIDE_BACK_OFFSET;
    }
  }

  adjustBobbing() {
    if (this.currentAction === 'w') {
      const bobFactor = BOBBING_FACTOR[this.legs.currentFrame];
      this.torso.position.y = -this.metrics.hips + bobFactor * BOBBING_TORSO_OFFSET;
      this.head.position.y = -this.metrics.neck + bobFactor * BOBBING_HEAD_OFFSET;
      this.armRight.position.y = -this.metrics.shoulders.y + bobFactor * BOBBING_TORSO_OFFSET;
      this.armLeft.position.y = -this.metrics.shoulders.y + bobFactor * BOBBING_TORSO_OFFSET;
    } else if (this.currentAction === 's') {
      // Set all bobs to 0
      this.torso.position.y = -this.metrics.hips;
      this.armRight.position.y = -this.metrics.shoulders.y;
      this.armLeft.position.y = -this.metrics.shoulders.y;
      this.head.position.y = -this.metrics.neck;
    }
  }
}

MarionetteView.SPRITE_ANIMATION_SPEED = 0.3;

module.exports = MarionetteView;
