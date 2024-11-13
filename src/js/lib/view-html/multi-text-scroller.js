const TextScroller = require('./text-scroller');

class MultiTextScroller {
  constructor(config) {
    this.config = config;
    this.$element = $('<div></div>')
      .addClass('multi-text-scroller');
    this.scrollers = [];
    this.speed = this.config?.map?.promptScrollSpeed || 100; // px per second
  }

  destroy() {
    this.clear();
  }

  clear() {
    this.scrollers.forEach((s) => { s.$element.remove(); s.destroy(); });
    this.scrollers = [];
  }

  displayText(text) {
    this.clear();

    this.config.game.languages.forEach((lang) => {
      const t = text?.[lang];
      if (t) {
        this.createScroller(t, lang);
      }
    });

    if (this.scrollers.length > 0) {
      this.scrollers[0].speed = this.speed;
      this.scrollers.forEach((scroller, i) => {
        if (i > 0) {
          scroller.speed = this.speed * (
            scroller.texts[0].width() / this.scrollers[0].texts[0].width()
          );
        }
      });
    }
  }

  createScroller(text, lang) {
    const scroller = new TextScroller(this.config, lang);
    this.$element.append(scroller.$element);
    this.scrollers.push(scroller);
    scroller.displayText(text);
    return scroller;
  }

  start() {
    this.scrollers.forEach((s) => { s.start(); });
  }

  stop() {
    this.scrollers.forEach((s) => { s.stop(); });
  }
}

module.exports = MultiTextScroller;
