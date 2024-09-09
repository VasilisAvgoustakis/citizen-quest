const logger = require('loglevel');
const deepmerge = require('deepmerge');
const InputMgr = require('./input-mgr');
const GamepadMapper = require('./gamepad-mapper');

/**
 * @typedef {
 *  horizontal: number,
 *  vertical: number,
 *  invertHorizontal: boolean,
 *  invertVertical: boolean
*  } GamepadMapperAxesConfig
 */

/**
 * @typedef {
 *  {axes?:GamepadMapperAxesConfig,buttons?:{InputMgrEventNames:number}}
 * } GamepadMapperConfig
 */

/**
 * Gamepad configuration for standard gamepads.
 *
 * @type {GamepadMapperConfig}
 */
const standardMapperConfig = {
  axes: {
    horizontal: 0,
    vertical: 1,
    invertHorizontal: false,
    invertVertical: false,
  },
  buttons: {
    up: 12,
    down: 13,
    left: 14,
    right: 15,
    action: 1,
    lang: 9,
  },
};

/**
 * Handles gamepad and joystick input from the first available device.
 *
 * @augments InputMgr
 */
class GamepadInputMgr extends InputMgr {
  /**
   * @param {GamepadMapperConfig} [mapperConfig]
   */
  constructor(mapperConfig = {}) {
    super();
    logger.info(
      mapperConfig,
      deepmerge(standardMapperConfig, mapperConfig ?? {})
    );
    this.mapper = new GamepadMapper(
      deepmerge(standardMapperConfig, mapperConfig ?? {})
    );
    this.gamepadIndex = -1;
    this.handleGamepadDisConnected = () => {
      const gamepad = navigator.getGamepads().find((g) => g !== null);
      if (typeof gamepad !== 'undefined') {
        logger.info(`Using gamepad ${gamepad.index}: ${gamepad.id}`);
        this.gamepadIndex = gamepad.index;
      } else {
        logger.info('No gamepad connected');
        this.gamepadIndex = -1;
      }
    };
  }

  attachListeners() {
    if (this.isListening()) return;

    // Connect to the first of the already connected gamepads, if any.
    this.handleGamepadDisConnected();

    // Attach listeners to handle future connects and disconnects.
    window.addEventListener('gamepadconnected', this.handleGamepadDisConnected);
    window.addEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisConnected
    );
    super.attachListeners();
    /**
     * TODO: Deal with SecurityError from missing gamepad permission.
     * TODO: Deal [missing secure context](https://github.com/w3c/gamepad/pull/120).
     * TODO: Handle browsers that don't support gamepads.
     * TODO: Emit warning when Gamepad API can not be used due the above reasons.
     */
  }

  detachListeners() {
    if (!this.isListening()) return;
    window.removeEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisConnected
    );
    this.hasListenersAttached = false;
    this.gamepadIndex = -1;
    super.detachListeners();
  }

  updateState() {
    const gamepad = navigator.getGamepads()[this.gamepadIndex] ?? null;
    if (gamepad !== null && gamepad.connected) {
      const newState = this.mapper.grab(gamepad);
      Object.assign(this.state, newState);
    }
  }
}

module.exports = GamepadInputMgr;
