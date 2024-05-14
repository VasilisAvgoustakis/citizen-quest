class ScoreCounterOverlay {
  constructor(config, categories) {
    this.config = config;
    this.scores = Object.fromEntries(categories.map((category) => [category, 0]));
    this.$element = $('<div></div>')
      .addClass('score-counter-overlay');
    this.counterValues = Object.fromEntries(categories.map((category) => (
      [
        category,
        $('<div></div>')
          .addClass('score-counter-value')
          .text('0'),
      ]
    )));
    this.counters = Object.fromEntries(categories.map((category) => (
      [
        category,
        $('<div></div>')
          .addClass('score-counter')
          .addClass(`score-counter-${category}`)
          .append(this.counterValues[category])
          .appendTo(this.$element),
      ]
    )));
  }

  reset() {
    Object.keys(this.scores).forEach((category) => {
      this.scores[category] = 0;
    });
    Object.values(this.counterValues).forEach(($value) => {
      $value.text('0');
    });
  }

  setScore(category, value) {
    if (this.scores[category] === undefined)  {
      throw new Error(`Category ${category} not found in score counter`);
    }
    this.scores[category] = value;
    this.counterValues[category].text(value);
  }

  incrementScore(category) {
    this.setScore(category, this.scores[category] + 1);
  }
}

module.exports = ScoreCounterOverlay;
