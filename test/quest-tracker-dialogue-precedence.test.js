const chai = require('chai');
const FlagStore = require('../src/js/lib/model/flag-store');
const QuestTracker = require('../src/js/lib/model/quest-tracker');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const DialogueIterator = require('../src/js/lib/model/dialogues/dialogue-iterator');
const TestDialogueIteratorContext = require('./lib/test-dialogue-iterator-context');
const getDialogueTrace = require('./lib/get-dialogue-trace');

const { expect } = chai;

function loadFixture(name) {
  return yaml.load(fs.readFileSync(path.join(__dirname, 'fixtures', 'quest-tracker', name)));
}

describe('QuestTracker dialogue precedence', () => {
  let questTracker = null;
  let flags = null;
  const fixture = loadFixture('precedence.yml');
  const config = {
    game: {
      maxActiveQuests: 2,
    },
    storylines: {
      default: fixture,
    },
  };

  beforeEach(() => {
    flags = new FlagStore();
    questTracker = new QuestTracker(config, flags);
    questTracker.setActiveStoryline('default');
  });

  it('should default to the npc dialogue', () => {
    const dialogue = questTracker.getNpcDialogue('boy');
    const context = new TestDialogueIteratorContext();
    const iterator = new DialogueIterator(dialogue, context);
    expect(getDialogueTrace(iterator)).to.deep.equal(['I like chocolate.']);
  });

  it('should use the storyline dialogue if there is one', () => {
    const dialogue = questTracker.getNpcDialogue('chocolateLover');
    const context = new TestDialogueIteratorContext();
    const iterator = new DialogueIterator(dialogue, context);
    expect(getDialogueTrace(iterator)).to.deep.equal(['I love every kind of chocolate.']);
  });

  it('should use the "available" dialogue if there is one', () => {
    const dialogue = questTracker.getNpcDialogue('mayor');
    const context = new TestDialogueIteratorContext();
    const iterator = new DialogueIterator(dialogue, context);
    expect(getDialogueTrace(iterator)).to.deep.equal(['Help me find out if everyone likes milk chocolate.']);
  });

  it('should not use the "available" dialogue if the quest is not available', () => {
    flags.set('quest.milkChocolate.done', true);
    const dialogue = questTracker.getNpcDialogue('mayor');
    const context = new TestDialogueIteratorContext();
    const iterator = new DialogueIterator(dialogue, context);
    expect(getDialogueTrace(iterator)).to.deep.equal(['Does everyone like chocolate?']);
  });

  it('should use the quest dialogue if there is one', () => {
    questTracker.setActiveQuest('milkChocolate');
    const dialogue = questTracker.getNpcDialogue('chocolateLover');
    const context = new TestDialogueIteratorContext();
    const iterator = new DialogueIterator(dialogue, context);
    expect(getDialogueTrace(iterator)).to.deep.equal(['I haven\'t tried milk chocolate.']);
  });

  it('should use the stage dialogue if there is one', () => {
    questTracker.setActiveQuest('milkChocolate');
    flags.set('hasTriedMilkChocolate', true);
    const dialogue = questTracker.getNpcDialogue('chocolateLover');
    const context = new TestDialogueIteratorContext();
    const iterator = new DialogueIterator(dialogue, context);
    expect(getDialogueTrace(iterator)).to.deep.equal(['I love milk chocolate.']);
  });
});
