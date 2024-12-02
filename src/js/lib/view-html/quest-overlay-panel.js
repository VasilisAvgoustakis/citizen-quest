const { I18nTextAdapter } = require('../helpers/i18n');
const { textWithEmojisToHtml } = require('../helpers/emoji-utils');

class QuestOverlayPanel {
  constructor(config, lang) {
    this.config = config;
    this.lang = lang;

    this.$element = $('<div></div>')
      .addClass('quest-overlay', 'visible');

    this.$prompt = $('<div></div>')
      .addClass('prompt')
      .appendTo(this.$element);

    this.promptI18n = new I18nTextAdapter((newText) => {
      this.$prompt.html(textWithEmojisToHtml(newText));
    }, this.lang);

    this.$counter = $('<div></div>')
      .addClass('counter')
      .appendTo(this.$element);
  }

  setLang(lang) {
    this.lang = lang;
    this.promptI18n.setLang(lang);
  }

  show() {
    this.$element.addClass('visible');
    this.$element.removeClass('hidden');
  }

  hide() {
    this.$element.removeClass('visible');
    this.$element.addClass('hidden');
  }

  reset() {
    this.promptI18n.setText('');
    this.clearCounter();
    this.hideCheckmark();
  }

  isVisible() {
    return this.$element.hasClass('visible');
  }

  setText(text) {
    this.promptI18n.setText(text);
  }

  clearCounter() {
    this.$counter.empty();
    this.$counter.hide();
  }

  createCounter(counter) {
    const { max, icon } = counter;
    this.$counter.show();
    for (let i = 0; i < max; i += 1) {
      $('<span></span>')
        .addClass('counter-item')
        .addClass(icon)
        .appendTo(this.$counter);
    }
  }

  setCounter(value) {
    this.$counter.children().each((index, element) => {
      $(element).toggleClass('active', index < value);
    });
  }

  showCheckmark() {
    this.$element.addClass('with-checkmark');
  }

  hideCheckmark() {
    this.$element.removeClass(['with-checkmark', 'with-checkmark-checked']);
  }

  checkCheckmark() {
    if (this.$element.hasClass('with-checkmark')) {
      this.$element.addClass('with-checkmark-checked');
    }
  }
}

module.exports = QuestOverlayPanel;
