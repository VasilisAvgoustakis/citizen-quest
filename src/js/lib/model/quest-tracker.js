const EventEmitter = require('events');
const LogicParser = require('./dialogues/logic-parser');
const safeBuildDialogueFromItems = require('./dialogues/dialogue-safe-builder');

/**
 * Quest active event. Fired when a quest becomes active.
 *
 * @event QuestTracker#questActive
 * @param {string} questId
 */

/**
 * Quest inactive event. Fired when a quest becomes inactive (because it's done or another quest
 * became active).
 *
 * @event QuestTracker#questInactive
 * @param {string} questId
 */

/**
 * Quest done event. Fired when a quest is done (it has been completed).
 *
 * @event QuestTracker#questDone
 * @param {string} questId
 */

/**
 * Stage changed event. Fired when the active stage changes.
 *
 * @event QuestTracker#stageChanged
 * @param {string} questId
 * @param {number} stage
 * @param {number} oldStage
 */

/**
 * Stage count changed event. Fired when the active stage counter changes.
 *
 * @event QuestTracker#stageCountChanged
 * @param {string} questId
 * @param {number} count
 * @param {number} oldCount
 */

/**
 * No quest event. Fired when there is no active quest.
 *
 * @event QuestTracker#noQuest
 */

class QuestTracker {
  constructor(config, flags) {
    this.config = config;
    this.flags = flags;
    this.events = new EventEmitter();

    this.activeStoryline = null;
    this.activeQuestId = null;
    this.activeStage = null;
    this.activeCounter = null;

    this.logicParser = new LogicParser({ flags });
    this.flags.events.on('flag', this.handleFlagChange.bind(this));
  }

  /**
   * Reset the state that tracks progress on the active storyline
   */
  reset() {
    this.clearFlags();
    this.activeQuestId = null;
    this.activeStage = null;
    this.activeCounter = null;
    this.initFlags();
  }

  /**
   * Clear all flags.
   */
  clearFlags() {
    this.flags.clear();
  }

  /**
   * Initialize the flags for the active storyline.
   *
   * All the flags specified in the initFlags of the storyline are set
   */
  initFlags() {
    const flags = [this.activeStoryline?.initFlags ?? []].flat();
    flags.forEach((flag) => this.flags.set(flag, 1, 'init'));
  }

  /**
   * Get the list of active flags with the specified prefix.
   *
   * Active flags are flags with a value greater than 0. The prefix is stripped from the flag names.
   * @returns {string[]}
   */
  getActiveFlags(prefix = '') {
    return Object.entries(this.flags.all())
      .filter(([key, value]) => key.startsWith(prefix) && value > 0)
      .map(([key]) => key.replace(new RegExp(`^${prefix}`), ''));
  }

  /**
   * Set the active storyline.
   *
   * @param {object} storyline
   */
  setActiveStoryline(storylineId) {
    const storyline = this.config?.storylines?.[storylineId];
    if (storyline === undefined) {
      throw new Error(`Error: Attempting to start invalid storyline ${this.storylineId}`);
    }
    this.activeStoryline = storyline;
    this.reset();
    this.events.emit('storylineChanged', storylineId);
  }

  /**
   * Returns true if there is an active quest.
   *
   * @return {boolean}
   */
  hasActiveQuest() {
    return this.activeQuestId !== null;
  }

  /**
   * Get the active quest.
   *
   * @returns {*|null}
   */
  getActiveQuest() {
    return this.activeStoryline?.quests?.[this.activeQuestId] || null;
  }

  /**
   * Get the active stage.
   *
   * @returns {*|null}
   */
  getActiveStage() {
    return this.getActiveQuest()?.stages?.[this.activeStage] || null;
  }

  /**
   * Set the active quest.
   *
   * @param {string} questId
   */
  setActiveQuest(questId) {
    if (questId !== this.activeQuestId) {
      if (this.activeQuestId) {
        this.events.emit('questInactive', this.activeQuestId);
        this.flags.set(`quest.${this.activeQuestId}.active`, 0);
      }
      this.activeQuestId = questId;
      this.activeStage = null;
      this.activeCounter = null;
      if (questId) {
        this.events.emit('questActive', questId);
      } else {
        this.events.emit('noQuest');
      }
      this.updateStage();
      this.updateCounter();
    }
  }

  /**
   * Get the list of quests that are available (as a list of quest IDs)
   *
   * @returns {string[]}
   */
  getAvailableQuests() {
    return Object.keys(this.activeStoryline.quests)
      .filter((id) => !this.questIsDone(id) && this.questRequirementsMet(id))
      .slice(0, this.config?.game?.maxActiveQuests || 3);
  }

  /**
   * Get the list of NPCs that have quests available (with their moods).
   *
   * The result is an object with the NPC IDs as keys and their moods as values.
   * The mood corresponds to the icon that should advertise the quest.
   *
   * @returns {{[p: string]: null|*}}
   */
  getNpcsWithQuests() {
    const availableQuests = this.getAvailableQuests();
    return Object.fromEntries(
      Object.entries(this.activeStoryline.quests)
        .filter(([id]) => availableQuests.includes(id))
        .map(([, props]) => [props.npc, props.mood])
    );
  }

  getNpcRoles(npcId) {
    return [this.activeStoryline?.npcs?.[npcId]?.actAs || []].flat();
  }

  /**
   * True if the quest passed is done.
   *
   * @param {string} questId
   * @returns {boolean}
   */
  questIsDone(questId) {
    return !!this.flags.value(`quest.${questId}.done`);
  }

  /**
   * True if the quest passed has its requirements met.
   *
   * @param {string} questId
   * @returns {boolean}
   */
  questRequirementsMet(questId) {
    const requiredQuests = this.activeStoryline?.quests?.[questId]?.required || [];
    return [requiredQuests].flat().every((id) => this.questIsDone(id));
  }

  /**
   * Get the current dialogue for the NPC passed.
   *
   * The dialogue is built by concatenating the dialogue items from the following sources, in order:
   * - dialogue items from the current stage
   * - dialogue items from the current quest
   * - dialogue items from all active quests
   * - dialogue items from the current storyline
   *
   * @param {string} npcId
   * @returns {Dialogue}
   */
  getNpcDialogue(npcId) {
    const currentQuest = this.activeStoryline?.quests?.[this.activeQuestId];
    const currentStage = currentQuest?.stages[this.activeStage];
    const canSwitchQuests = this.config.game.canSwitchQuests !== undefined
      ? this.config.game.canSwitchQuests : true;
    const npcRoles = this.getNpcRoles(npcId);
    const findRoleInDialogues = (roles, dialogues) => {
      const firstMatchingRole = roles.find((r) => dialogues?.[r]);
      return dialogues?.[firstMatchingRole];
    };
    const canStartNewQuest = !this.hasActiveQuest() || canSwitchQuests;

    const activeStageDialogue = currentStage?.dialogues?.[npcId];
    const activeStageRoleDialogue = findRoleInDialogues(npcRoles, currentStage?.dialogues);
    const activeQuestDialogue = currentQuest?.dialogues?.[npcId];
    const activeQuestRoleDialogue = findRoleInDialogues(npcRoles, currentQuest?.dialogues);
    const availableQuestDialogues = this.getAvailableQuests()
      .filter((id) => this.activeStoryline.quests[id]?.npc === npcId)
      .map((id) => this.activeStoryline.quests[id]?.available?.dialogue)
      .shift();
    const storylineDialogue = this.activeStoryline?.dialogues?.[npcId];
    const storylineRoleDialogue = findRoleInDialogues(npcRoles, this.activeStoryline?.dialogues);
    const npcDialogue = this.activeStoryline?.npcs?.[npcId]?.dialogue;

    const dialogueItems = (
      activeStageDialogue
      || activeStageRoleDialogue
      || activeQuestDialogue
      || activeQuestRoleDialogue
      || (canStartNewQuest && availableQuestDialogues)
      || storylineDialogue
      || storylineRoleDialogue
      || npcDialogue
      || []);

    return safeBuildDialogueFromItems(npcId, dialogueItems);
  }

  /**
   * Get the dialogue for the storyline ending
   *
   * @returns {Dialogue}
   */
  getEndingDialogue() {
    const items = this.activeStoryline?.ending?.dialogue;
    return safeBuildDialogueFromItems('ending', items);
  }

  /**
   * True if the flag passed indicates a quest became active.
   *
   * The format checked is `quest.<questId>.active`.
   *
   * @protected
   * @param {string} flag
   * @returns {boolean}
   */
  isQuestActiveFlag(flag) {
    const flagParts = flag.split('.');
    return flagParts.length === 3
      && flagParts[0] === 'quest'
      && this.activeStoryline?.quests?.[flagParts[1]] !== undefined
      && flagParts[2] === 'active';
  }

  /**
   * True if the flag passed indicates a quest became done.
   *
   * The format checked is `quest.<questId>.done`.
   *
   * @protected
   * @param {string} flag
   * @returns {boolean}
   */
  isQuestDoneFlag(flag) {
    const flagParts = flag.split('.');
    return flagParts.length === 3
      && flagParts[0] === 'quest'
      && this.activeStoryline?.quests?.[flagParts[1]] !== undefined
      && flagParts[2] === 'done';
  }

  /**
   * Handle a flag change.
   *
   * @private
   * @param {string} flag
   * @param {number} value
   */
  handleFlagChange(flag, value) {
    if (this.isQuestActiveFlag(flag) && value === 1) {
      this.onQuestActive(flag.split('.')[1]);
    } else if (this.isQuestDoneFlag(flag) && value === 1) {
      this.onQuestDone(flag.split('.')[1]);
    }

    this.updateCounter();
    this.updateStage();
  }

  /**
   * Recalculates the active stage counter (if there is one).
   *
   * If the value of the counter changed, the `stageCountChanged` event is fired.
   *
   * @private
   */
  updateCounter() {
    if (this.activeQuestId === null || this.activeStage === null) {
      return;
    }
    const stage = this.activeStoryline.quests[this.activeQuestId].stages[this.activeStage];
    if (stage?.counter !== undefined) {
      const newCount = this.logicParser.evaluate(stage.counter.expression);
      if (newCount !== this.activeCounter) {
        const oldCount = this.activeCounter;
        this.activeCounter = newCount;
        this.events.emit('stageCountChanged', this.activeQuestId, newCount, oldCount);
      }
    }
  }

  /**
   * Finds and sets the currently active stage.
   *
   * The current stage is the first stage in the active quest whose condition evaluates to true.
   *
   * @private
   */
  updateStage() {
    if (!this.activeQuestId) {
      return;
    }

    const stages = this.activeStoryline?.quests?.[this.activeQuestId]?.stages || [];
    const newStage = stages.findIndex(
      (stage) => stage.cond === undefined || !!this.logicParser.evaluate(stage.cond)
    );

    // todo: Handle the case where no stages match
    if (newStage !== this.activeStage) {
      this.onStageChanged(newStage);
    }
  }

  /**
   * Handle a quest becoming active.
   *
   * @param {string} questId
   * @private
   */
  onQuestActive(questId) {
    this.setActiveQuest(questId);
  }

  /**
   * Handle a quest becoming done.
   *
   * @param {string} questId
   * @private
   */
  onQuestDone(questId) {
    this.setActiveQuest(null);
    this.events.emit('questDone', questId);
  }

  /**
   * Handle a stage change.
   *
   * @param {string} stage
   * @private
   */
  onStageChanged(stage) {
    const oldStage = this.activeStage;
    this.activeStage = stage;
    this.activeCounter = null;
    this.events.emit('stageChanged', this.activeQuestId, stage, oldStage);
    this.updateCounter();
  }
}

module.exports = QuestTracker;
