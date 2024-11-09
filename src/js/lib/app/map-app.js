/* eslint-disable no-console */
/* globals PIXI */

require('../helpers-web/fill-with-aspect');
const Stats = require('../helpers-web/stats/stats');
const FlagStore = require('../model/flag-store');
const QuestTracker = require('../model/quest-tracker');
const TownView = require('../view-pixi/town-view');
const PCView = require('../view-pixi/pc-view');
const CharacterView = require('../view-pixi/character-view');
const Character = require('../model/character');
const KeyboardInputMgr = require('../input/keyboard-input-mgr');
const MapMarker = require('../view-pixi/map-marker');
const MultiTextScroller = require('../view-html/multi-text-scroller');
const InclusionBar = require('../view-html/inclusion-bar');
const Scenery = require('../model/scenery');
const SceneryView = require('../view-pixi/scenery-view');
const ScoreCounterOverlay = require('../view-html/score-counter-overlay');
const ScoreCounterAdapter = require('../adapters/score-counter-adapter');

class MapApp {
  constructor(config, textures) {
    this.config = config;
    this.textures = textures;

    // Game logic
    this.storylineId = null;
    this.flags = new FlagStore();

    this.questTracker = new QuestTracker(config, this.flags);
    this.questMarkers = {};

    this.questTracker.events.on('storylineChanged', (storylineId) => {
      this.clearNpcs();
      this.clearScenery();
      const storyline = this.config?.storylines?.[storylineId];
      if (storyline === undefined) {
        throw new Error(`Error: Attempting to start invalid storyline ${storylineId}`);
      }
      this.textScroller.displayText(storyline.prompt);
      this.textScroller.start();
      Object.entries(storyline.scenery || {}).forEach(([id, props]) => {
        this.addScenery(new Scenery(id, props));
      });
      this.updateScenery();
      Object.entries(storyline.npcs).forEach(([id, props]) => {
        this.addNpc(new Character(id, props));
      });
      this.updateNpcs();
      this.updateQuestMarkers();
    });

    this.questTracker.events.on('questActive', () => {
      this.updateQuestMarkers();
      this.updateScenery();
      this.updateNpcs();
    });
    this.questTracker.events.on('questDone', () => {
      this.updateQuestMarkers();
      this.updateScenery();
      this.updateNpcs();
    });

    this.pcs = {};
    this.pcViews = {};
    this.npcViews = {};
    this.sceneryViews = {};

    // HTML elements
    this.$element = $('<div></div>')
      .addClass('map-app');

    this.$pixiWrapper = $('<div></div>')
      .addClass('pixi-wrapper')
      .appendTo(this.$element);

    // PIXI
    this.pixiApp = new PIXI.Application({
      width: MapApp.APP_WIDTH,
      height: MapApp.APP_HEIGHT,
      backgroundColor: 0xffffff,
    });
    this.$pixiWrapper.append(this.pixiApp.view);

    this.camera = new PIXI.Container();
    this.pixiApp.stage.addChild(this.camera);
    this.townView = new TownView(this.config, this.textures);
    this.camera.addChild(this.townView.display);

    this.camera.width = MapApp.APP_WIDTH;
    this.camera.height = MapApp.APP_HEIGHT;

    // HTML Overlays
    this.stats = new Stats();
    this.$element.append(this.stats.dom);

    this.textScroller = new MultiTextScroller(config);
    this.$element.append(this.textScroller.$element);

    this.inclusionBar = new InclusionBar(config);
    this.$element.append(this.inclusionBar.$element);

    if (this.config.map.scoreCounter) {
      const options = this.config.map.scoreCounter;
      this.scoreCounterOverlay = new ScoreCounterOverlay(
        this.config,
        options.categories.map((category) => category.id)
      );
      this.$element.append(this.scoreCounterOverlay.$element);
      this.scoreCounterAdapter = new ScoreCounterAdapter(
        options,
        this.flags,
        this.scoreCounterOverlay
      );
    }

    // Input
    this.keyboardInputMgr = new KeyboardInputMgr();
    this.keyboardInputMgr.attachListeners();

    if (this.config.game.devModeShortcuts !== false) {
      this.keyboardInputMgr.addToggle('KeyD', () => {
        this.stats.togglePanel();
      });
      this.keyboardInputMgr.addToggle('KeyF', () => {
        console.log(this.flags.dump());
      });
    }

    this.seenFlags = {};
    this.flags.events.on('flag', (flagId, value, oldValue, setter) => {
      if (this.seenFlags[flagId]) {
        return;
      }
      this.seenFlags[flagId] = true;

      if (flagId.startsWith('inc.')) {
        const flagParts = flagId.split('.');
        const type = flagParts[1];
        if (type) {
          this.inclusionBar.add(type);
        }
      }

      this.updateScenery();
      this.updateNpcs();
    });

    // Game loop
    this.pixiApp.ticker.add((time) => {
      this.stats.frameBegin();

      Object.entries(this.pcViews).forEach(([, pcView]) => {
        pcView.display.position = pcView.character.position;
        pcView.display.zIndex = pcView.character.position.y;
        pcView.animate(time);
      });
      this.townView.mainLayer.sortChildren();

      this.stats.frameEnd();
    });
  }

  setStoryline(storylineId) {
    this.storylineId = storylineId;
    this.resetGameState();
  }

  resetGameState() {
    this.seenFlags = {};
    this.inclusionBar.clear();
    this.questTracker.setActiveStoryline(this.storylineId);
  }

  resize() {
    this.$element.fillWithAspect(MapApp.APP_WIDTH / MapApp.APP_HEIGHT);
    this.$element.css('font-size', `${(this.$element.width() * MapApp.FONT_RATIO).toFixed(3)}px`);
  }

  addPc(id) {
    const pc = new Character(id, this.config.players[id]);
    this.pcs[id] = pc;

    const view = new PCView(this.config, this.textures, pc, this.townView);
    this.pcViews[id] = view;
    this.townView.mainLayer.addChild(view.display);

    this.addMarker(view, `player-${id}`);
  }

  removePc(id) {
    if (this.pcViews[id]) {
      this.townView.mainLayer.removeChild(this.pcViews[id].display);
      delete this.pcs[id];
      delete this.pcViews[id];
    }
  }

  addNpc(npc) {
    const view = new CharacterView(this.config, this.textures, npc, this.townView);
    if (npc.cond) {
      view.hide(false);
    }
    this.npcViews[npc.id] = view;
    this.townView.mainLayer.addChild(view.display);
  }

  removeNpc(id) {
    if (this.npcViews[id]) {
      this.townView.mainLayer.removeChild(this.npcViews[id].display);
      delete this.npcViews[id];
    }
  }

  clearNpcs() {
    Object.values(this.npcViews).forEach((npcView) => {
      this.townView.mainLayer.removeChild(npcView.display);
    });
    this.npcViews = {};
  }

  addScenery(scenery) {
    const view = new SceneryView(this.config, this.textures, scenery, this.townView);
    if (scenery.cond) {
      view.hide(false);
    }
    this.townView.mainLayer.addChild(view.display);
    this.sceneryViews[scenery.id] = view;
  }

  removeScenery(id) {
    if (this.sceneryViews[id]) {
      this.townView.mainLayer.removeChild(this.sceneryViews[id].display);
      delete this.sceneryViews[id];
    }
  }

  clearScenery() {
    Object.values(this.sceneryViews).forEach((sceneryView) => {
      this.townView.mainLayer.removeChild(sceneryView.display);
    });
    this.sceneryViews = [];
  }

  ensureSceneryVisible(id) {
    const view = this.sceneryViews[id];
    if (view && !view.isVisible()) {
      view.show();
    }
  }

  ensureSceneryHidden(id) {
    const view = this.sceneryViews[id];
    if (view && view.isVisible()) {
      view.hide();
    }
  }

  updateScenery() {
    const storyline = this.config.storylines[this.storylineId];
    Object.entries(storyline.scenery || {}).forEach(([id, props]) => {
      // If the scenery has a cond property, evaluate it
      if (props.cond) {
        const conditionMet = this.questTracker.isConditionMet(props.cond);
        if (conditionMet) {
          this.ensureSceneryVisible(id);
        } else {
          this.ensureSceneryHidden(id);
        }
      }
    });
  }

  ensureNpcHidden(id) {
    const view = this.npcViews[id];
    if (view && view.isVisible()) {
      view.hide();
    }
  }

  ensureNpcVisible(id) {
    const view = this.npcViews[id];
    if (view && !view.isVisible()) {
      view.show();
    }
  }

  updateNpcs() {
    const storyline = this.config.storylines[this.storylineId];
    Object.entries(storyline.npcs || {}).forEach(([id, props]) => {
      // If the npc has a cond property, evaluate it
      if (props.cond) {
        const conditionMet = this.questTracker.isConditionMet(props.cond);
        if (conditionMet) {
          this.ensureNpcVisible(id);
        } else {
          this.ensureNpcHidden(id);
        }
      }
    });
  }

  addMarker(character, icon) {
    const marker = new MapMarker(
      this.textures['map-markers'].textures['pin-marker'],
      this.textures.icons.textures[`icon-${icon}`],
      { x: 0.5, y: 1 }
    );
    marker.setScale(this.townView.display.width / MapApp.APP_WIDTH);
    character.addAttachment('map-marker', marker);
    character.display.addChild(marker.display);
    marker.setPosition(0, -character.display.height);
    marker.popper.show();
  }

  // eslint-disable-next-line class-methods-use-this
  removeMarker(character, onComplete = () => {}) {
    const marker = character.getAttachment('map-marker');
    if (marker) {
      marker.hide(() => {
        character.removeAttachment('map-marker');
        onComplete();
      });
    } else {
      onComplete();
    }
  }

  updateQuestMarkers() {
    const npcsWithQuests = this.questTracker.getNpcsWithQuests();
    Object.values(this.npcViews).forEach((npcView) => {
      const npcId = npcView.character.id;
      if (Object.keys(npcsWithQuests).includes(npcId)) {
        const questIcon = npcsWithQuests[npcView.character.id];
        if (this.questMarkers[npcId] === undefined) {
          this.addMarker(npcView, questIcon);
        } else if (this.questMarkers[npcId] !== questIcon) {
          this.removeMarker(npcView, () => {
            this.addMarker(npcView, questIcon);
          });
        }
        this.questMarkers[npcId] = questIcon;
      } else if (this.questMarkers[npcId]) {
        delete this.questMarkers[npcId];
        this.removeMarker(npcView);
      }
    });
  }
}

MapApp.APP_WIDTH = 1920;
MapApp.APP_HEIGHT = 1080;
MapApp.FONT_RATIO = 0.0175; // 1.75% of the width of the app

module.exports = MapApp;
