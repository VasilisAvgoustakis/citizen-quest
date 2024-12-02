const UIQueue = require('./ui-queue');
const QuestOverlayPanel = require('./quest-overlay-panel');

const HIDE_PROMPT_DURATION = 500;
const SHOW_PROMPT_DURATION = 1250;
const COUNTER_UPDATE_DURATION = 1250;
const MARK_DONE_DURATION = 1250;

class QuestOverlay {
  constructor(config, lang) {
    this.config = config;
    this.lang = lang;

    this.uiQueue = new UIQueue();

    this.panel = new QuestOverlayPanel(config, lang);
    this.$element = this.panel.$element;
    this.currentPromptOptions = null;
    this.currentCount = null;
  }

  setLang(lang) {
    this.lang = lang;
    this.panel.setLang(lang);
  }

  hide() {
    this.uiQueue.cancel();
    this.panel.hide();
  }

  showPrompt(options) {
    if (this.currentPromptOptions?.text === options?.text) {
      return;
    }
    this.currentPromptOptions = options;
    const {
      text,
      counter,
      keepCount,
      initialCount,
      withCheckmark,
    } = { ...QuestOverlay.defaultPromptOptions, ...options };

    this.uiQueue.add(() => {
      this.panel.hide();
    }, () => (this.panel.isVisible() ? HIDE_PROMPT_DURATION : 0));

    this.currentCount = (keepCount && this.currentCount) ? this.currentCount : initialCount;
    if (text) {
      this.uiQueue.add(() => {
        this.panel.reset();
        this.panel.setText(text);

        if (withCheckmark) {
          this.panel.showCheckmark();
        }
        if (counter) {
          this.panel.createCounter(counter);
          this.panel.setCounter(this.currentCount);
        }
        this.panel.show();
      }, SHOW_PROMPT_DURATION);
    }
  }

  updatePrompt(changedOptions) {
    const options = { ...this.currentPromptOptions, keepCount: true, ...changedOptions };
    this.showPrompt(options);
  }

  setCounter(count) {
    this.currentCount = count;
    this.uiQueue.add(() => {
      this.panel.setCounter(count);
    }, COUNTER_UPDATE_DURATION);
  }

  markDone(duration = MARK_DONE_DURATION, initialDelay = 0) {
    if (initialDelay) {
      this.uiQueue.addPause(initialDelay);
    }
    this.uiQueue.add(() => {
      this.panel.checkCheckmark();
    }, duration);
  }
}

QuestOverlay.defaultPromptOptions = {
  text: '',
  counter: null,
  withCheckmark: false,
  keepCount: false,
  initialCount: 0,
};

module.exports = QuestOverlay;
