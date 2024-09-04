/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/sass/test.scss":
/*!****************************!*\
  !*** ./src/sass/test.scss ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!************************!*\
  !*** ./src/js/test.js ***!
  \************************/
__webpack_require__(/*! ../sass/test.scss */ "./src/sass/test.scss");

function resize() {
  $('.scale-fit').each((i, el) => {
    $(el).find('iframe').each((j, iframe) => {
      const width = $(iframe).attr('width');
      const height = $(iframe).attr('height');
      const parentWidth = $(el).parent().width();
      const scale = parentWidth / width;

      $(el).css({
        width: `${width * scale}px`,
        height: `${height * scale}px`,
      });

      $(iframe).css({
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      });
    });
  });
}

// Throttled resize event
let resizeTimeout;
$(window).on('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resize();
  }, 100);
});

resize();

// Handle errors within the iframe
$('.station').each((i, container) => {
  $(container).find('iframe').each((j, iframe) => {
    iframe.contentWindow.onerror = () => {
      $(container).addClass('error');
      return false;
    };
  });
});


})();

/******/ })()
;
//# sourceMappingURL=test.6f96ba283b5ef5526f35.js.map