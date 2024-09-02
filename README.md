# Citizen Quest

An exhibit about the Future of Democracy.

## Compilation

To install the required dependencies run `npm install` in **both** the root directory and the
`server` directory.

You can use `npm run build` or `npm run watch` in the root directory to build the client apps. The
server does not require compilation.

The `.env` file in the root directory contains settings that are applied at compilation time.

## Running

Start the server by running `npm run start` in the `server` directory.

The clients, in the root directory, are:

- `index.html`: Demo/test client .
- `player.html`: Player station client.
- `map.html`: City map station client.

## Query strings

The `player.html` client accepts the following query string parameters:
- `p`: Player ID. Defaults to 1.
- `s`: ID of the stats panel to show (fps, render, ping). Defaults to none.

The `map.html` client accepts the following query string parameters:
- `s`: ID of the stats panel to show (fps, render, ping). Defaults to none.

The `index.html` app accepts the following query string parameters:
- `storyline`: Storyline ID to load. Defaults to the first storyline. 
- `s`: ID of the stats panel to show (fps, render, ping). Defaults to none.
- `t`: Time limit for the game, in remainingSeconds. Defaults to 300 remainingSeconds.
- `test`: A live test to perform (e.g. `dialogue-responses`)
- `settings`: The name of a settings file to load. Defaults to `settings.yml`. It must reside in the
  root directory and have a name that only contains letters, numbers, - or _, and ends in `.yml`.

## Configuration

The configuration files are in the `config` directory. The server has to be reloaded after any changes.
Clients get the configuration from the server through the http API and have to be reloaded after
the server to take any changes.

You can override any of the configuration keys through a `settings.yml` file in the root directory.

The .env file has other configuration keys that affect the environment.

The `app.config.json` file in the root directory contains build-time configuration settings.

## Server APIs

The server has both an HTTP and a WebSocket API. Their specifications are:

- http: `specs/openapi.yaml`
- ws: `specs/asyncapi.yaml`

You can use [Swagger Editor](https://editor.swagger.io/) and the
[AsyncAPI Playground](https://playground.asyncapi.io/) to format the respective specifications in
a friendly format.

## Sentry support

The server and the clients have support for Sentry. 

The server can take the DSN from the `SENTRY_DSN` environment variable, or through the CLI option
`--sentry-dsn`.

The clients can take the DSN from the `sentry-dsn` query string parameter.

Both can also get the DSN from the `system.sentry.dsn` configuration key (`config/system.yml`), 
which can be overriden with the `settings.yml` file.

## Debugging tools

The following keyboard shortcuts are available in the player app if the `game.userModeShortcuts`
configuration key is not set to `false`:

- 'e': Ends the countdown and jumps to the game end.

All the previous ones, plus the following keyboard shortcuts are available in the player app if the 
`game.devModeShortcuts` configuration key is not set to `false`:

- 'd': Toggle stats panel. Each press of 'd' toggles to a different panel.
- 'f': Dumps flags to the javascript console.
- 'h': Shows hitboxes.
- 's': Makes scenery sprites semi-transparent.
- 'x': Outputs the player's position to the javascript console.

The following keyboard shortcuts are available in the map app:

- 'd': Toggle stats panel. Each press of 'd' toggles to a different panel.
- 'f': Dumps flags to the javascript console.

## Credits

Developed by Eric Londaits and Christian Stussak for IMAGINARY gGmbH. 

## License

Copyright (c) 2023 IMAGINARY gGmbH
Licensed under the MIT license (see LICENSE)
Supported by Futurium gGmbH
