/* eslint-disable class-methods-use-this,no-unused-vars */
/**
 * Abstract class for dialogue effects.
 *
 * Dialogue effects are used to add visual effects to dialogues.
 * Each effect type should create a subclass of this class and register it. The game engine
 * will create an instance of the effect when it is used in a dialogue, passing the options
 * specified in the dialogue script.
 *
 * Effects lifetime is as follows:
 *
 * 1. The effect is created.
 * 2. The start() method is called.
 * 3. The animate method is called repeatedly, until the effect ends.
 * 4. The handleActionButton method is called if the action button is pressed before the effect is done.
 * 5. The effect may announce it is done starting by calling the doneCallback passed to the start method.
 * 6. The end() method is called to start reversing any changes made by the effect.
 * 7. The effect may announce it is done ending by calling the doneCallback passed to the end method.
 * 7. The terminate() method is called to clean up any resources used by the effect.
 *
 * Until the effect is done ending:
 * - The animate method will be called.
 * - The handleActionButton method will be called.
 *
 * After the effect is done ending:
 *  - The animate method will not be called.
 *  - The handleActionButton method will no longer be called.
 *
 * start() and end() may never be called, if the effect is terminated before it starts, or ends...
 * ... but terminate() will always be called, and should ensure to clean up any resources and
 * undo any lasting changes made by the effect.
 *
 * Once the terminate method is called:
 *  - No other methods will be called.
 */
class DialogueEffect {
  /**
   * Constructor
   *
   * @param {PlayerApp} app
   *  The player app.
   * @param {object} options
   *  Options for the effect.
   */
  constructor(app, options = {}) {
    if (this.constructor === DialogueEffect) {
      throw new TypeError('DialogueEffect is an abstract class and cannot be instantiated.');
    }
    this.app = app;
    this.options = { ...this.getDefaultOptions(), ...options };
    this.state = DialogueEffect.States.IDLE;
  }

  /**
   * Start the effect.
   *
   * This method is called by the dialogue sequencer when the effect is to be started.
   *
   * @param {function} doneCallback
   *  Callback to be called when the effect is done.
   */
  start(doneCallback) {
    this.state = DialogueEffect.States.STARTING;
    this.onStarting(() => {
      doneCallback();
      this.state = DialogueEffect.States.ACTIVE;
      this.onActive();
    });
  }

  /**
   * End the effect, and clean up.
   *
   * This method is called by the dialogue sequencer when the changes made by the effect should be
   * reversed. The effect should call the doneCallback when it is done.
   */
  end(doneCallback) {
    this.state = DialogueEffect.States.ENDING;
    this.onEnding(() => {
      doneCallback();
      this.state = DialogueEffect.States.FINISHED;
      this.onFinished();
    });
  }

  /**
   * Update the effect.
   *
   * @param {number} time
   */
  animate(time) {
  }

  /**
   * Handle the action button while the effect is not done.
   *
   * This method is called by the dialogue sequencer when the action button is pressed, if the
   * effect is not done. The effect can use this to skip to the end of the effect, or
   * accelerate it.
   */
  handleActionButton() {
  }

  /**
   * Get the default options for the effect.
   *
   * This method should be overridden by subclasses to provide default options for the effect.
   * @return {{}}
   */
  getDefaultOptions() {
    return {};
  }

  /**
   * Terminate the effect.
   */
  terminate() {

  }

  /**
   * Called when the effect is starting.
   *
   * @param {function} doneCallback
   *  Callback to be called when the effect is done starting.
   */
  onStarting(doneCallback) {

  }

  /**
   * Called when the effect is active.
   */
  onActive() {

  }

  /**
   * Called when the effect is ending.
   *
   * @param {function} doneCallback
   *  Callback to be called when the effect is done ending.
   */
  onEnding(doneCallback) {

  }

  /**
   * Called when the effect is finished.
   */
  onFinished() {

  }
}

DialogueEffect.States = {
  IDLE: 'idle',
  STARTING: 'starting',
  ACTIVE: 'active',
  ENDING: 'ending',
  FINISHED: 'finished',
};

module.exports = DialogueEffect;
