# Citizen Quest Server

Server for the Citizen QUest exhibit.

This server connects the different stations that form part of the exhibit.

## Options

- **Port** (default 4850): Set through the PORT env var or the `-p` / `--port` options.
- **Settings file** (default '../settings.yml'): One or more settings files that will override the
  default configuration. Set through the SETTINGS_FILE env var or the `-s` / `--settings-file` options.
  It's possible to use `-s` multiple times to specify multiple files. If using SETTINGS_FILE, separate 
  them with the system path delimiter (e.g. `:` in POSIX).
- **Sentry DSN** (default undefined): Set through the SENTRY_DSN env var or the `--sentry-dsn` option.
- **Output config** (default false): If true, prints the contents of the configuration before
    starting the server. Set through the OUTPUT_CONFIG env var or the `-o` / `--output-config` option.

## Credits

Developed by Eric Londaits for IMAGINARY gGmbH.

## License

Copyright (c) 2023 IMAGINARY gGmbH
Licensed under the MIT license (see LICENSE)
Supported by Futurium gGmbH
