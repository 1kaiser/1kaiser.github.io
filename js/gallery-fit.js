// Scales the whole .model-card fan so it never crosses within 20px of the
// left/right viewport edges, at any window width. Mirrors the spread math
// in gallery-vue.js (numCards, spread, card width) rather than measuring
// the DOM, since cards are laid out via inline transforms computed there.
(function () {
  "use strict";

  var MARGIN = 20; // px, each side
  var CARD_WIDTH = 210;
  var SPREAD = 147;
  // gallery-vue.js scales edge cards up to MAX_SCALE (parallax: edges
  // larger, center smaller) -- the outermost cards are what actually
  // determine the fan's true left/right extent, so use their scaled
  // width here, not the base 210px. Must match MAX_SCALE there
  // (0.75 overall SCALE_FACTOR * 1.2 parallax max = 0.9).
  var EDGE_SCALE = 0.9;
  var EDGE_CARD_WIDTH = CARD_WIDTH * EDGE_SCALE;

  function apply() {
    var container = document.querySelector(".gallery-container");
    if (!container) return;

    var numCards = (window.modelsConfig && window.modelsConfig.length) || 10;
    var naturalSpan = (numCards - 1) * SPREAD + EDGE_CARD_WIDTH;
    var available = window.innerWidth - MARGIN * 2;
    var factor = Math.min(1, available / naturalSpan);

    container.style.transform = "scale(" + factor.toFixed(4) + ")";
  }

  apply();
  window.addEventListener("resize", apply);

  // gallery-vue.js mounts on DOMContentLoaded-ish timing via Vue; run once
  // more shortly after load in case the container wasn't in the DOM yet.
  window.addEventListener("load", apply);
  setTimeout(apply, 300);
})();
