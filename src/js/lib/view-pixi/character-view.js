/* globals PIXI */

const MoodBalloon = require('./mood-balloon');

class CharacterView {
  constructor(config, textures, character, townView) {
    this.config = config;
    this.textures = textures;
    this.character = character;
    this.townView = townView;
    this.display = this.createSprite();
    this.moodBalloon = null;
    this.attachments = {};
  }

  createSprite() {
    const sprite = new PIXI.Sprite(this.textures['npcs-demo'].textures[this.character.type]);
    sprite.anchor.set(0.5, 1);

    sprite.position = this.character.position;
    sprite.zIndex = sprite.position.y;

    return sprite;
  }

  destroy() {
    // Remove all attachments
    Object.keys(this.attachments).forEach((id) => {
      this.removeAttachment(id);
    });
    // Destroy the mood baloon
    if (this.moodBalloon) {
      this.moodBalloon.destroy();
      this.moodBalloon = null;
    }
    this.display.removeFromParent();
    this.display.destroy();
  }

  showMoodBalloon(mood) {
    if (this.moodBalloon === null) {
      this.moodBalloon = new MoodBalloon(this);
    }
    this.moodBalloon.show(mood);
  }

  hideMoodBalloon() {
    if (this.moodBalloon) {
      this.moodBalloon.hide();
    }
  }

  hasMoodBalloon() {
    return this.moodBalloon !== null && this.moodBalloon.visible;
  }

  inRect(rect) {
    const { x, y } = this.character.position;
    return x >= rect.left && x <= rect.right
      && y >= rect.top && y <= rect.bottom;
  }

  addAttachment(id, attachment) {
    if (this.attachments[id]) {
      this.removeAttachment(id);
    }
    this.attachments[id] = attachment;
    this.display.addChild(attachment.display);
  }

  removeAttachment(id) {
    if (this.attachments[id]) {
      this.display.removeChild(this.attachments[id].display);
      if (this.attachments[id].destroy) {
        this.attachments[id].destroy();
      }
      delete this.attachments[id];
    }
  }

  getAttachment(id) {
    return this.attachments[id];
  }
}

CharacterView.SPRITE_ANIMATION_SPEED = 0.3;

module.exports = CharacterView;
