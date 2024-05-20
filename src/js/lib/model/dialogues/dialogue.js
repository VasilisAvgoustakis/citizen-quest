const { validateDialogueDefinition } = require('./dialogue-schema-validation');

class Dialogue {
  constructor() {
    this.root = null;
    this.nodes = [];
    this.nodesById = {};
  }

  getNode(id) {
    return this.nodesById[id];
  }

  /**
   * Create a Dialogue from a json dialogue definition
   *
   * @throws {Ajv.ValidationError}
   * @param {Object} data A json dialogue definition (see doc/dialogues.md)
   * @returns {Dialogue}
   */
  static fromJson(data) {
    validateDialogueDefinition(data);
    const newDialogue = new Dialogue();
    newDialogue.root = JSON.parse(JSON.stringify(data));
    newDialogue.root.type = 'root';

    const stack = [newDialogue.root];
    while (stack.length > 0) {
      const node = stack.pop();
      newDialogue.nodes.push(node);
      if (node.items) {
        node.items.forEach((item, index) => {
          item.parent = node;
          if (!item.type) {
            if (item.effect) {
              item.type = 'effect';
            } else {
              item.type = 'statement';
            }
          }
          if (!item.id) {
            item.id = `${node.id}-${index}`;
          }
          if (item.responses) {
            item.responses.forEach((response, responseIndex) => {
              response.parent = item;
              if (!response.id) {
                response.id = `${item.id}-${responseIndex}`;
              }
            });

            item.responsesById = Object.fromEntries(
              item.responses.map((response) => [response.id, response])
            );
          }
        });
        stack.push(...node.items);
      }
    }

    newDialogue.nodes.forEach((node) => {
      newDialogue.nodesById[node.id] = node;
    });

    return newDialogue;
  }
}

module.exports = Dialogue;
