const chai = require('chai');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const FlagStore = require('../src/js/lib/model/flag-store');
const QuestTracker = require('../src/js/lib/model/quest-tracker');

const { expect } = chai;

function loadFixture(name) {
  return yaml.load(fs.readFileSync(path.join(__dirname, 'fixtures', 'quest-tracker', name)));
}

describe('QuestTracker progressive prompts', () => {
  let questTracker = null;
  let flags = null;
  const fixture = loadFixture('progressive-prompts.yml');
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
    questTracker.setActiveQuest('catchTheBurglar');
  });

  it('should default to the first prompt in a set', () => {
    expect(questTracker.getActiveStagePrompt()).to.equal('Find the victim of the burglary.');
  });

  it('should provide an alternate prompt if the hint level is raised', () => {
    questTracker.incHintLevel();
    expect(questTracker.getActiveStagePrompt()).to.equal('Talk to the boy.');
  });

  it('should provide the top prompt if the hint level is more than the number of prompts', () => {
    questTracker.incHintLevel();
    questTracker.incHintLevel();
    expect(questTracker.getActiveStagePrompt()).to.equal('Talk to the boy.');
    questTracker.setHintLevel(Infinity);
    expect(questTracker.getActiveStagePrompt()).to.equal('Talk to the boy.');
  });

  it('should reset the hint level when the stage changes', () => {
    questTracker.incHintLevel();
    expect(questTracker.getActiveStagePrompt()).to.equal('Talk to the boy.');
    flags.set('talkedToVictim', 1);
    expect(questTracker.getActiveStagePrompt()).to.equal('Find the chocolate burglar.');
    questTracker.incHintLevel();
    expect(questTracker.getActiveStagePrompt()).to.equal('See anyone suspicious hidden in a corner?');
    questTracker.incHintLevel();
    expect(questTracker.getActiveStagePrompt()).to.equal('The burglar hides in the lower right corner.');
  });

  it('should provide a lone prompt on any hint level', () => {
    flags.set('talkedToVictim', 1);
    flags.set('foundBurglar', 1);
    expect(questTracker.getActiveStagePrompt()).to.equal('Return to the mayor.');
    questTracker.incHintLevel();
    expect(questTracker.getActiveStagePrompt()).to.equal('Return to the mayor.');
  });

  it('should provide the target only on hint levels that specify it', () => {
    expect(questTracker.getActiveStageTarget()).to.be.null;
    questTracker.incHintLevel();
    expect(questTracker.getActiveStageTarget()).to.equal('boy');
  });

  it('should reset the target when the stage changes', () => {
    expect(questTracker.getActiveStageTarget()).to.be.null;
    questTracker.incHintLevel();
    expect(questTracker.getActiveStageTarget()).to.equal('boy');
    flags.set('talkedToVictim', 1);
    expect(questTracker.getActiveStageTarget()).to.be.null;
    questTracker.incHintLevel();
    questTracker.incHintLevel();
    expect(questTracker.getActiveStageTarget()).to.equal('chocolateBurglar');
  });
});
