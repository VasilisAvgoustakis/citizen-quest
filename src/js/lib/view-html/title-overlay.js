const { I18nTextAdapter } = require('../helpers/i18n');

class TitleOverlay {
  constructor(config, lang) {
    this.config = config;
    this.lang = lang;

    this.$element = $('<div></div>')
      .addClass('title-overlay');

    this.$title = $('<h1></h1>')
      .addClass('logo')
      .appendTo(this.$element);

    this.$pressStart = $('<div></div>')
      .addClass('press-start')
      .appendTo(this.$element);

    this.$pressStartFrame = $('<div></div>')
      .addClass('frame')
      .appendTo(this.$pressStart);

    this.$pressStartText = $('<div></div>')
      .addClass('text')
      .appendTo(this.$pressStartFrame);

    this.titleI18n = new I18nTextAdapter((newText) => {
      this.$title.text(newText);
    }, this.lang, this.config.i18n.ui.title);

    this.promptI18n = new I18nTextAdapter((newText) => {
      this.$pressStartText.text(newText);
    }, this.lang, this.config.i18n.ui.pressStart);
  }

  setLang(lang) {
    this.lang = lang;
    this.titleI18n.setLang(lang);
    this.promptI18n.setLang(lang);
  }

  show() {
    this.$element.addClass('visible');
  }

  hide() {
    this.$element.removeClass('visible');
  }
}

module.exports = TitleOverlay;
