class DialogueEffectFactory {
  static Effects = {};

  /**
   * Constructor
   *
   * @param {PlayerApp} app
   */
  constructor(app) {
    this.app = app;
  }

  /**
   * Create a new effect.
   *
   * @param {string} name
   *  The name of the effect.
   * @param {object} options
   *  Options for the effect.
   * @returns {DialogueEffect}
   *  The effect.
   */
  createEffect(name, options) {
    const Effect = DialogueEffectFactory.Effects[name];
    if (!Effect) {
      throw new Error(`Unknown effect: ${name}`);
    }
    return new Effect(this.app, options);
  }
}

DialogueEffectFactory.registerEffect = function (name, effectClass) {
  DialogueEffectFactory.Effects[name] = effectClass;
};

module.exports = DialogueEffectFactory;
