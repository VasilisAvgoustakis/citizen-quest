/* globals PIXI */
const CharEditView = require('../view-pixi/char-edit-view');
const KeyboardInputMgr = require('../input/keyboard-input-mgr');

const viewPaneWidth = 400;
const viewPaneHeight = 400;
const viewPaneBgColor = 0xe3d0c2;

class CharEditApp {
  constructor(config, textures) {
    this.config = config;
    this.textures = textures;

    // HTML elements
    this.$element = $('<div></div>')
      .addClass('char-edit-app');

    this.$pixiWrapper = $('<div></div>')
      .addClass('pixi-wrapper')
      .appendTo(this.$element);

    // PIXI
    this.pixiApp = new PIXI.Application({
      width: viewPaneWidth,
      height: viewPaneHeight,
      backgroundColor: viewPaneBgColor,
    });
    this.$pixiWrapper.append(this.pixiApp.view);

    this.charEditView = new CharEditView(
      this.config,
      this.textures,
      this.pixiApp,
      viewPaneWidth,
      viewPaneHeight
    );
    this.pixiApp.stage.addChild(this.charEditView.getDisplay());

    this.inputMgr = this.createInputMgr();

    // Game loop
    const lastDirection = { x: 0, y: 0 };
    let lastMoving = false;
    this.pixiApp.ticker.add((time) => {
      this.inputMgr.update();
      const { x, y } = this.inputMgr.getDirection();
      const isMoving = x || y;
      if (isMoving && (x !== lastDirection.x || y !== lastDirection.y || !lastMoving)) {
        this.charEditView.setAction('w', x, y);
        lastDirection.x = x;
        lastDirection.y = y;
        lastMoving = true;
      } else if (lastMoving && !isMoving) {
        this.charEditView.setAction('s', lastDirection.x, lastDirection.y);
        lastMoving = false;
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  createInputMgr() {
    const keyboardInputMgr = new KeyboardInputMgr();
    keyboardInputMgr.attachListeners();
    return keyboardInputMgr;
  }
}

module.exports = CharEditApp;
