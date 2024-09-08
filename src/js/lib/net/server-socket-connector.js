/* eslint-disable no-console */
const EventEmitter = require('events');
const ConnectingState = require('./server-socket-connector-states/connecting');
const ClosingState = require('./server-socket-connector-states/closing');
const ReconnectDelayState = require('./server-socket-connector-states/reconnect-delay');
const OpenState = require('./server-socket-connector-states/open');

class ServerSocketConnector {
  constructor(config, uri, clientId) {
    this.config = config;
    this.uri = uri;
    this.clientId = clientId;
    this.ws = null;
    this.events = new EventEmitter();
    this.state = null;

    this.autoReconnect = true;
    this.serverId = null;

    // Add a handler for the page being closed or refreshed
    const terminationEvent = 'onpagehide' in window.self ? 'pagehide' : 'unload';
    window.addEventListener(terminationEvent, (event) => {
      if (event.persisted === false && this.ws) {
        this.destroySocket();
      }
    });

    this.connect();
  }

  setState(state) {
    if (this.state) {
      this.state.onExit();
    }
    this.state = state;
    if (this.state) {
      this.state.onEnter();
    }
  }

  destroySocket() {
    this.setState(null);

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  connect() {
    this.destroySocket();

    console.log(`Connecting to ${this.uri}...`);
    this.events.emit('connecting');
    // Build the URI adding the clientId in the query string
    const uri = new URL(this.uri);
    uri.searchParams.set('clientID', this.clientId);
    this.ws = new WebSocket(uri.href);
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);

    this.setState(new ConnectingState(this));
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    const message = typeof data === 'string' ? { type: data } : data;
    this.ws.send(JSON.stringify(message));
  }

  // eslint-disable-next-line class-methods-use-this
  isSyncable(flag) {
    return (flag.startsWith('quest.') && flag.endsWith('.done'))
      || flag.startsWith('pnt.')
      || flag.startsWith('inc.')
      || flag.startsWith('global.');
  }

  // To do: Move this outside of this class
  sync(round = 0, player = null, flagStore = null) {
    const message = {
      type: 'sync',
      round,
    };
    if (player !== null) {
      message.players = Object.fromEntries([[player.id,
        {
          position: player.position,
          speed: player.speed,
        },
      ]]);
    }
    if (flagStore !== null) {
      message.flags = Object.fromEntries(
        Object.entries(flagStore.all()).filter(([id]) => this.isSyncable(id))
      );
    }
    this.send(message);
  }

  addPlayer(playerID) {
    this.send({
      type: 'addPlayer',
      playerID,
    });
  }

  removePlayer(playerID) {
    this.send({
      type: 'removePlayer',
      playerID,
    });
  }

  playerReady(state, playerID) {
    this.send({
      type: 'playerReady',
      state,
      playerID,
    });
  }

  close() {
    if (this.ws) {
      console.log('Closing connection...');
      this.events.emit('closing');
      this.ws.close();
    }
    this.setState(new ClosingState(this));
  }

  onClose() {
    if (this.autoReconnect) {
      this.setState(new ReconnectDelayState(this));
    } else {
      this.destroySocket();
    }
  }

  onServerId(serverId) {
    if (this.serverId === null) {
      this.serverId = serverId;
    } else if (this.serverId !== serverId) {
      console.warn(`The server has a new serverID (${serverId}). The client must be reloaded.`);
      this.events.emit('server-relaunched');
      this.destroySocket();
    }
  }

  onSync(message) {
    this.events.emit('sync', message);
  }

  handleOpen() {
    console.log('Connected.');
    this.events.emit('connect');
    this.setState(new OpenState(this));
  }

  handleClose(event) {
    // event.code is defined here https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    // but according to people the only code one normally gets is 1006 (Abnormal Closure)
    console.warn(
      `Disconnected with code ${event.code}`,
      event.code === 1006 ? ': Abnormal closure' : '',
      event.reason ? `(reason: ${event.reason})` : ''
    );
    this.events.emit('disconnect');
    this.onClose();
  }

  handleMessage(event) {
    if (this.state) {
      this.state.onMessage(event);
    } else {
      console.error('Received message while in an unknown stateHandler:', event.data);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleError(event) {
    // No behaviour beyond logging because as far as we tested, the event does not provide any
    // useful information and the close event should also be raised.
    console.warn('WebSocket error:', event);
  }
}

module.exports = ServerSocketConnector;
