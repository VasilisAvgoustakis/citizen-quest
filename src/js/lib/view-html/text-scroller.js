/* globals PIXI */

const MAX_TEXTS = 10;

class TextScroller {
  constructor(config, id = null) {
    this.config = config;
    this.$element = $('<div></div>')
      .addClass('text-scroller');
    if (id) {
      this.$element.addClass(`text-scroller-${id}`);
    }
    this.texts = [];
    this.speed = 75; // px per second
    this.ticker = this.ticker.bind(this);
  }

  destroy() {
    this.stop();
    this.clear();
  }

  clear() {
    this.texts.forEach((t) => { t.remove(); });
    this.texts = [];
  }

  displayText(text) {
    this.clear();
    const $text = $('<div></div>')
      .addClass('text')
      .html(text);
    this.$element.append($text);
    this.texts.push($text);
    // Measure the text width against the container width.
    // Create as many copies of the text as needed to fill the container.
    const containerWidth = this.$element.width();
    const textWidth = $text.width();
    const textCount = Math.min(Math.ceil(containerWidth / textWidth), MAX_TEXTS);
    for (let i = 0; i < textCount; i += 1) {
      const $textCopy = $text.clone();
      this.$element.append($textCopy);
      this.texts.push($textCopy);
    }
    // Place the first text on the left edge of the container.
    // and each subsequent text to the right of the previous one.
    this.scrollTexts(0);
  }

  // eslint-disable-next-line class-methods-use-this
  moveSingleText($text, left) {
    $text.data('left', left);
    $text.css('left', `${left}px`);
  }

  scrollTexts(distance) {
    // Move the first text by the distance
    this.moveSingleText(this.texts[0], (this.texts[0].data('left') || 0) - distance);
    // Move each text to the right of the previous one.
    // This might seem wasteful, but when the webfont finishes loading,
    // the text width might change, so we need to re-measure the text width.
    // This is not optimal, but it's good enough for now.
    this.texts.forEach(($t, i) => {
      if (i > 0) {
        const previousText = this.texts[i - 1];
        this.moveSingleText($t, previousText.data('left') + previousText.outerWidth());
      }
    });
    // If a text has moved off the left edge of the container,
    // move it to the right edge of rightmost text.
    while (this.texts[0].data('left') + this.texts[0].width() < 0) {
      const leftmostText = this.texts.shift();
      const rightmostText = this.texts[this.texts.length - 1];
      const newLeft = parseInt(rightmostText.css('left'), 10) + rightmostText.width();
      this.moveSingleText(leftmostText, newLeft);
      this.texts.push(leftmostText);
    }
  }

  start() {
    PIXI.Ticker.shared.add(this.ticker);
  }

  stop() {
    PIXI.Ticker.shared.remove(this.ticker);
  }

  ticker(time) {
    // Elapsed seconds
    const elapsed = time / PIXI.settings.TARGET_FPMS / 1000;
    // Distance to move
    const distance = elapsed * this.speed;
    // Scroll the texts
    this.scrollTexts(distance);
  }
}

module.exports = TextScroller;
