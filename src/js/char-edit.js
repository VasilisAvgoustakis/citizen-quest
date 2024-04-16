/* eslint-disable no-console */
const showFatalError = require('./lib/helpers-web/show-fatal-error');
const CharEditApp = require('./lib/app/char-edit-app');
require('../sass/default.scss');
const fetchTextures = require('./lib/helpers-client/fetch-textures');

(async () => {
  try {
    const textures = await fetchTextures('./static/textures', {
      bundles: [
        {
          name: 'town-view',
          assets: [
            {
              name: 'sprites-char',
              srcs: 'sprites-char.json',
            },
          ],
        },
      ],
    }, 'town-view');

    const charEditApp = new CharEditApp({}, textures);
    $('[data-component="CharEditApp"]').replaceWith(charEditApp.$element);
  } catch (err) {
    showFatalError(err.message, err);
    console.error(err);
  }
})();
