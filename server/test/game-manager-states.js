const { expect } = require('chai');
const FakeTimers = require('@sinonjs/fake-timers');
const GameManager = require('../lib/game-manager');
const {
  IDLE, ROUND_STARTING, ROUND_IN_PROGRESS, ROUND_COMPLETED,
} = require('../lib/game-manager-states/states');

describe('Game manager state handling', () => {
  const GAME_DURATION = 300;
  const INTRO_TIMEOUT = 30;
  const ENDING_TIMEOUT = 30;
  let gameManager = null;
  let clock = null;

  beforeEach(() => {
    clock = FakeTimers.install();
    gameManager = new GameManager({
      game: {
        duration: GAME_DURATION,
        introTimeout: INTRO_TIMEOUT,
        endingTimeout: ENDING_TIMEOUT,
      },
      players: {
        1: { },
        2: { },
        3: { },
        4: {
          enabled: false,
        },
      },
      storylines: {
        aStory: { },
      },
    });
    gameManager.init();
  });

  afterEach(() => {
    clock.uninstall();
  });

  describe('idle state', () => {
    it('should start in this state', () => {
      expect(gameManager.getState()).to.equal(IDLE);
    });

    it('should transition to the roundStarting state when a player is added', () => {
      gameManager.handleAddPlayer('1');
      expect(gameManager.getState()).to.equal(ROUND_STARTING);
    });

    it('should directly add players to the round', () => {
      expect(gameManager.round.getPlayerCount()).to.equal(0);
      gameManager.handleAddPlayer('1');
      expect(gameManager.round.getPlayerCount()).to.equal(1);
    });

    it('should not timeout', () => {
      clock.runAll();
      expect(gameManager.getState()).to.equal(IDLE);
    });
  });

  describe('roundStarting state', () => {
    beforeEach(() => {
      gameManager.handleAddPlayer('1');
      expect(gameManager.getState()).to.equal(ROUND_STARTING);
    });

    it('should stay in the state if more players are added', () => {
      expect(gameManager.round.getPlayerCount()).to.equal(1);
      gameManager.handleAddPlayer('2');
      expect(gameManager.getState()).to.equal(ROUND_STARTING);
      expect(gameManager.round.getPlayerCount()).to.equal(2);
      gameManager.handleAddPlayer('3');
      expect(gameManager.getState()).to.equal(ROUND_STARTING);
      expect(gameManager.round.getPlayerCount()).to.equal(3);
    });

    it('should do nothing if players are removed', () => {
      gameManager.handleRemovePlayer('1');
      expect(gameManager.getState()).to.equal(ROUND_STARTING);
      expect(gameManager.round.getPlayerCount()).to.equal(1);
    });

    it('should transition to the roundInProgress state when a solo player is ready', () => {
      gameManager.handlePlayerReady('1');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
    });

    it('should transition to the roundInProgress state when the first player is ready', () => {
      gameManager.handleAddPlayer('2');
      gameManager.handleAddPlayer('3');
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      gameManager.handlePlayerReady('2');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
    });

    it('should transition to the roundInProgress state on timeout', () => {
      clock.tick(INTRO_TIMEOUT * 1000 + 3000);
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
    });
  });

  describe('roundInProgress state', () => {
    beforeEach(() => {
      gameManager.handleAddPlayer('1');
      gameManager.handlePlayerReady('1');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
    });

    it('should stay in the state if more players are added', () => {
      expect(gameManager.round.getPlayerCount()).to.equal(1);
      gameManager.handleAddPlayer('2');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(2);
      gameManager.handleAddPlayer('3');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(3);
    });

    it('should allow removing players as long as one remains', () => {
      gameManager.handleAddPlayer('2');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(2);
      gameManager.handleRemovePlayer('1');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(1);
      gameManager.handleAddPlayer('3');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(2);
      gameManager.handleAddPlayer('1');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      gameManager.handleRemovePlayer('2');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(2);
    });

    it('should transition to roundCompleted when a solo player aborts', () => {
      gameManager.handleRemovePlayer('1');
      expect(gameManager.round.getPlayerCount()).to.equal(1);
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });

    it('should transition to roundCompleted when the last player aborts', () => {
      gameManager.handleAddPlayer('2');
      gameManager.handleAddPlayer('3');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      gameManager.handleRemovePlayer('1');
      gameManager.handleRemovePlayer('3');
      gameManager.handleRemovePlayer('2');
      expect(gameManager.round.getPlayerCount()).to.equal(1);
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });

    it('should transition to roundCompleted when a solo player is ready', () => {
      gameManager.handlePlayerReady('1');
      expect(gameManager.round.getPlayerCount()).to.equal(1);
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });

    it('should not transition to roundCompleted when only one player is ready', () => {
      gameManager.handleAddPlayer('2');
      gameManager.handleAddPlayer('3');
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      gameManager.handlePlayerReady('1');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
    });

    it('should transition to roundCompleted when all players are ready', () => {
      gameManager.handleAddPlayer('2');
      gameManager.handleAddPlayer('3');
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      gameManager.handlePlayerReady('1');
      gameManager.handlePlayerReady('2');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      gameManager.handlePlayerReady('3');
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });

    it('should not expect removed players to be ready', () => {
      gameManager.handleAddPlayer('2');
      gameManager.handleAddPlayer('3');
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      gameManager.handleRemovePlayer('2');
      expect(gameManager.round.getPlayerCount()).to.equal(2);
      gameManager.handlePlayerReady('1');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      gameManager.handlePlayerReady('3');
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });

    it('should not count players who aborted as ready', () => {
      gameManager.handleAddPlayer('2');
      gameManager.handleAddPlayer('3');
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      gameManager.handlePlayerReady('1');
      gameManager.handlePlayerReady('2');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      gameManager.handleRemovePlayer('1');
      gameManager.handleAddPlayer('1');
      gameManager.handlePlayerReady('3');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      gameManager.handlePlayerReady('1');
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });

    it('should check if all players are ready when one leaves', () => {
      gameManager.handleAddPlayer('2');
      gameManager.handleAddPlayer('3');
      expect(gameManager.round.getPlayerCount()).to.equal(3);
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      gameManager.handlePlayerReady('2');
      gameManager.handlePlayerReady('3');
      expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
      gameManager.handleRemovePlayer('1');
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });

    it('should transition to roundCompleted on timeout', () => {
      clock.tick(GAME_DURATION * 1000);
      expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
    });
  });

  describe('roundCompleted state', () => {
    describe('with a solo player', () => {
      beforeEach(() => {
        gameManager.handleAddPlayer('1');
        gameManager.handlePlayerReady('1');
        gameManager.handlePlayerReady('1');
        expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
      });

      it('should queue players that are added', () => {
        expect(gameManager.round.getPlayerCount()).to.equal(1);
        expect(gameManager.hasQueuedPlayers()).to.be.false;
        gameManager.handleAddPlayer('2');
        expect(gameManager.round.getPlayerCount()).to.equal(1);
        expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
        expect(gameManager.hasQueuedPlayers()).to.be.true;
        gameManager.handleAddPlayer('3');
        expect(gameManager.round.getPlayerCount()).to.equal(1);
        expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
        expect(gameManager.hasQueuedPlayers()).to.be.true;
      });

      it('should not allow players to be removed', () => {
        gameManager.handleRemovePlayer('1');
        expect(gameManager.round.getPlayerCount()).to.equal(1);
        expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
      });

      it('should not remove queued players', () => {
        gameManager.handleAddPlayer('2');
        expect(gameManager.hasQueuedPlayers()).to.be.true;
        gameManager.handleRemovePlayer('2');
        expect(gameManager.hasQueuedPlayers()).to.be.true;
        expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
      });

      it('should transition to idle when a player is ready', () => {
        gameManager.handlePlayerReady('1');
        expect(gameManager.getState()).to.equal(IDLE);
        expect(gameManager.round.getPlayerCount()).to.equal(0);
      });

      it('should transition to roundStarting when a player is ready and there\'s one in queue', () => {
        gameManager.handleAddPlayer('2');
        gameManager.handlePlayerReady('1');
        expect(gameManager.getState()).to.equal(ROUND_STARTING);
        expect(gameManager.round.getPlayerCount()).to.equal(1);
      });

      it('should transition to roundStarting when a player is ready and there\'s a queue', () => {
        gameManager.handleAddPlayer('2');
        gameManager.handleAddPlayer('3');
        gameManager.handlePlayerReady('1');
        expect(gameManager.getState()).to.equal(ROUND_STARTING);
        expect(gameManager.round.getPlayerCount()).to.equal(2);
      });

      it('should transition to idle on timeout', () => {
        clock.tick(ENDING_TIMEOUT * 1000 + 3000);
        expect(gameManager.getState()).to.equal(IDLE);
        expect(gameManager.round.getPlayerCount()).to.equal(0);
      });

      it('should transition to roundStarting on timeout if there\'s a queue', () => {
        gameManager.handleAddPlayer('2');
        clock.tick(ENDING_TIMEOUT * 1000 + 3000);
        expect(gameManager.getState()).to.equal(ROUND_STARTING);
        expect(gameManager.round.getPlayerCount()).to.equal(1);
      });
    });

    describe('with multiple players', () => {
      beforeEach(() => {
        gameManager.handleAddPlayer('1');
        expect(gameManager.getState()).to.equal(ROUND_STARTING);
        gameManager.handleAddPlayer('2');
        gameManager.handlePlayerReady('1');
        expect(gameManager.getState()).to.equal(ROUND_IN_PROGRESS);
        gameManager.handlePlayerReady('1');
        gameManager.handlePlayerReady('2');
        expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
        expect(gameManager.round.getPlayerCount()).to.equal(2);
      });

      it('should not transition to idle when only one player is ready', () => {
        gameManager.handlePlayerReady('1');
        expect(gameManager.getState()).to.equal(ROUND_COMPLETED);
      });

      it('should transition to idle when all players are ready', () => {
        gameManager.handlePlayerReady('1');
        gameManager.handlePlayerReady('2');
        expect(gameManager.getState()).to.equal(IDLE);
      });
    });
  });
});
