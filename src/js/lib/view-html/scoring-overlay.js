const UIQueue = require('./ui-queue');
const { I18nTextAdapter } = require('../helpers/i18n');

class ScoringOverlay {
  constructor(config, lang) {
    this.config = config;
    this.lang = lang;
    this.uiQueue = new UIQueue();
    this.$element = $('<div></div>')
      .addClass('scoring-overlay');
    this.activeTitle = null;
  }

  showAchievement(type) {
    this.uiQueue.add(() => {
      $('<div></div>')
        .addClass('achievement')
        .addClass(`achievement-${type}`)
        .css('background-image', `url(static/icons/stats-${type}.svg)`)
        .appendTo(this.$element);
    }, 2000);
    this.uiQueue.add(() => {
      this.clear();
    });
  }

  showInclusion(type) {
    this.uiQueue.add(() => {
      const $titleElement = $('<div></div>')
        .addClass('inclusion-title')
        .text(this.config?.i18n?.inclusion?.[type] || '');

      this.activeTitle = new I18nTextAdapter((newText) => {
        $titleElement.html(newText);
      }, this.lang, this.config.i18n.ui.includedInDecision);

      $('<div></div>')
        .addClass('inclusion')
        .addClass(`inclusion-${type}`)
        .append($titleElement)
        .append($('<div></div>')
          .addClass('inclusion-image-container')
          .append($('<div></div>')
            .addClass('inclusion-image')
            .css('background-image', `url(/static/inclusion/${type}.svg)`)))
        .appendTo(this.$element);
    }, 2500);
    this.uiQueue.add(() => {
      this.clear();
    });
  }

  clear() {
    this.$element.empty();
    this.activeTitle = null;
  }

  setLang(code) {
    this.lang = code;
    if (this.activeTitle) {
      this.activeTitle.setLang(code);
    }
  }
}

module.exports = ScoringOverlay;
