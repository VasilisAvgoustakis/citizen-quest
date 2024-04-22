const { getText } = require('../../src/js/lib/helpers/i18n');

const MAX_TRANSITIONS = 10;
function getDialogueTrace(iterator, input = [], lang = null) {
  const trace = [];
  let transitions = 0;
  const log = [];
  while (!iterator.isEnd()) {
    const activeNode = iterator.getActiveNode();
    log.push(activeNode.id);
    const { text } = activeNode;
    if (text !== undefined) {
      trace.push(getText(text, lang));
    }
    if (activeNode.responses && activeNode.responses.length > 0) {
      const responseIndex = input.shift();
      if (activeNode.responses[responseIndex] === undefined) {
        throw new Error(`Invalid input ${responseIndex} (${activeNode.id}:${iterator.dialogue.root.id})`);
      }
      const response = activeNode.responses[responseIndex];
      trace.push(`>> ${getText(response.text, lang)}`);
      if (response.thenText) {
        trace.push(getText(response.thenText, lang));
      }
      iterator.nextWithResponse(activeNode.responses[responseIndex].id);
    } else {
      iterator.next();
    }
    transitions += 1;
    if (transitions > MAX_TRANSITIONS) {
      throw new Error(`Exceeded max transitions (${MAX_TRANSITIONS}): ${log.join(' -> ')}`);
    }
  }
  return trace;
}

module.exports = getDialogueTrace;
