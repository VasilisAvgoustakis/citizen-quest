# A proposal to change the game's state tracking

## Station

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> ready: action
    ready --> intro: RX playerAdded
    intro --> playing: RX roundStarted
    intro --> playing: action
    intro --> playing: timeout
    playing --> ending: abort
    playing --> ending: RX roundEnded
    ending --> idle: action
    ending --> idle: timeout
    ending --> idle: RX playerRemoved
```
This state would be tracked client-side.

- **idle**: The station is in the title screen, waiting for a player.
- **ready**: The station is waiting for a round to start, either because there is no current round,
  or because the game is in its **ended** state, and we're waiting for a new round. 
- **intro**: The station is in the intro phase of the game.
- **playing**: The station is in the play phase of the game.
- **ending**: The station is in the ending phase of the game.

### Error handling

```mermaid
stateDiagram-v2
    ready --> idle: timeout
    intro --> idle: [session destroyed]
    playing --> idle: [session destroyed]
```

- During **intro**, and **playing**, a session should exist. If the server
    destroyed the session, the station should reset back to idle.
- The **ready** state should eventually time out, and the station reset back to idle. 

## Game Server

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> roundStarting: addPlayer
    roundStarting --> roundInProgress: playerReady
    roundStarting --> roundInProgress: timeout
    roundInProgress --> roundCompleted: timeOver
    roundInProgress --> roundCompleted: removePlayer<br>[playerCount == 1]
    roundInProgress --> roundCompleted: playerReady<br>[players.allReady]
    roundCompleted --> idle: playerReady<br>[players.allReady]
    roundCompleted --> idle: timeout
```

- **idle**: No one is playing.
- **roundStarting**: A round is starting. There's at least one player.
- **roundInProgress**: A round is being played.
- **ended**: The round has ended.

## Interplay between Game Server and the Stations

- **Game 'idle'**: No sessions exist. Stations can only be in the **idle**, or **ready** states.
- **Game 'roundStarting'**: One or more sessions exist. Stations can be **idle**, **ready** (waiting to get 
   the server response), or **intro** (waiting for the player to press the button).
- **Game 'roundInProgress'**: At least one station is in the **intro**, or **playing** state. The rest could be in any state.
- **Game 'roundCompleted'**: At least one station is in the **ending** state. The rest could be in 
  **ending**, **ready**, or **idle**.

