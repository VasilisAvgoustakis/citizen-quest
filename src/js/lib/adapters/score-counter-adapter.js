/**
 * The ScoreCounterAdapter class is responsible for updating a ScoreCounterOverlay based
 * on events from a FlagStore.
 *
 * It takes an options object that specifies the categories of scores to track,
 * and the flag patterns that should trigger score changes. Options are objects
 * with the following properties:
 *
 * - categories: an array of objects with the following properties:
 *   - id: the id of the score category
 *   - pattern: a regular expression pattern to match against flag names
 */
class ScoreCounterAdapter {
  constructor(options, flagStore, scoreCounterOverlay) {
    this.options = options;
    this.flagStore = flagStore;
    this.scoreCounterOverlay = scoreCounterOverlay;

    this.patterns = Object.fromEntries(
      this.options.categories.map((category) => [category.id, new RegExp(category.pattern)])
    );

    this.flagStore.events.on('flag', this.handleFlag.bind(this));
    this.flagStore.events.on('clear', this.handleClear.bind(this));
  }

  handleFlag(flag) {
    this.options.categories.forEach((category) => {
      if (this.patterns[category.id].test(flag)) {
        this.scoreCounterOverlay.incrementScore(category.id);
      }
    });
  }

  handleClear() {
    this.scoreCounterOverlay.reset();
  }
}

module.exports = ScoreCounterAdapter;
