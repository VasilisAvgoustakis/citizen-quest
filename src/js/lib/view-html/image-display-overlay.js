const logger = require('loglevel');
const imgPreload = require('../helpers-web/img-preload');

class ImageDisplayOverlay {
  constructor(config, lang) {
    this.config = config;
    this.lang = lang;

    this.$element = $('<div></div>')
      .addClass('image-display-overlay');

    this.$image = $('<div></div>')
      .addClass('image')
      .appendTo(this.$element);

    this.imageSrc = null;
    this.currOptions = null;
    this.optionClasses = [];

    window.ido = this;
  }

  getLocalImageSrc() {
    if (typeof this.imageSrc === 'string') {
      return this.imageSrc;
    }
    if (typeof this.imageSrc === 'object') {
      return this.imageSrc[this.lang] ?? this.imageSrc.en;
    }
    return null;
  }

  setLang(lang) {
    this.lang = lang;
    if (this.imageSrc) {
      this.replaceSrc();
    }
  }

  async replaceSrc() {
    this.localSrc = this.getLocalImageSrc();
    const thisCallSrc = this.localSrc;
    return imgPreload(this.localSrc, this.currOptions.imageLoadTimeout)
      .then(() => {
        if (this.localSrc === thisCallSrc) {
          this.$image.css('background-image', `url(${this.localSrc})`);
          return true;
        }
        return false;
      })
      .catch((err) => {
        logger.error(err);
      });
  }

  async showImage(src, options) {
    this.clear();
    this.currOptions = { ...ImageDisplayOverlay.defaultOptions, ...options };
    this.imageSrc = src;
    return this.replaceSrc().then((replacedSrc) => {
      if (replacedSrc) {
        this.$image.css('animation-duration', `${this.currOptions.enterAnimationDuration}ms`);
        this.$image.addClass('shown');
        this.optionClasses.push(`size-${this.currOptions.size}`);
        this.$image.addClass(this.optionClasses);
      }
    });
  }

  hideImage(exitAnimationDuration = 500) {
    this.$image.css('animation-duration', `${exitAnimationDuration}ms`);
    this.$image.addClass('hidden');
  }

  clear() {
    this.$image.removeClass('shown');
    this.$image.removeClass('hidden');
    this.$image.removeClass(this.optionClasses);
    this.$image.css('background-image', '');
    this.imageSrc = null;
    this.currOptions = null;
    this.optionClasses = [];
  }
}

ImageDisplayOverlay.defaultOptions = {
  size: 'full',
  imageLoadTimeout: 3000,
  enterAnimationDuration: 500,
};

module.exports = ImageDisplayOverlay;
