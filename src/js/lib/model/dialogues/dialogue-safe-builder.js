const Dialogue = require('./dialogue');
const logger = require('loglevel');

function emptyDialogue(id) {
  return Dialogue.fromJson({
    id,
    items: [{
      text: '...',
    }],
  });
}

function safeBuildDialogueFromItems(id, items) {
  try {
    if (items.length === 0) {
      logger.error(`Dialogue with id ${id} has no items`);
      return emptyDialogue(id);
    }
    return Dialogue.fromJson({
      id,
      items,
    });
  } catch (e) {
    if (e.errors) {
      const errorText = [];
      errorText.push(`Error parsing dialogue with id ${id}:`);
      e.errors.forEach((error) => {
        errorText.push(`- ${error.instancePath} : ${error.message}`);
      });
      logger.error(errorText.join('\n'));
    }
    return emptyDialogue(id);
  }
}

module.exports = safeBuildDialogueFromItems;
