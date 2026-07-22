// Background carousel: cycles the 10 Pi3X reconstruction scans behind the
// existing gallery, rendered live via <model-viewer> (same element the
// foreground cards use, already loaded -- no separate Three.js stack)
// rather than static posters, so real sun-position math can actually
// affect how they look via exposure + camera-orbit + a CSS tint, using
// js/sun-lighting.js. The enlarge button reuses the exact same modal
// (window.openModelModal, see js/app.js) the foreground gallery cards
// use, rather than a second parallel interaction system -- same
// camera-controls/AR/download/opaque-panel behavior in both places.
(function () {
  "use strict";

  var HF_BASE = "https://huggingface.co/datasets/1kaiser/models/resolve/main/";

  // VID20230408091040 and VID20230408100354 removed (the latter was the
  // degenerate near-empty reconstruction, only 2,926 points -- flagged
  // earlier this session) -- also removed from the Hugging Face dataset.
  var scans = [
    { file: "VID20230408092322", pts: 566905 },
    { file: "VID20230408092500", pts: 906245 },
    { file: "VID20230408095210", pts: 140899 },
    { file: "VID20230408100423", pts: 117726 },
    { file: "VID20230408111201", pts: 77622 },
    { file: "VID20230408113045", pts: 28408 },
    { file: "VID20230408152015", pts: 1192779 },
    { file: "VID20230408163443", pts: 871261 }
  ];

  var root = document.createElement("div");
  root.id = "bg-carousel";

  var wraps = [];
  var viewers = [];
  var labels = [];

  scans.forEach(function (s, i) {
    var wrap = document.createElement("div");
    wrap.className = "bg-scan-wrap";

    var mv = document.createElement("model-viewer");
    mv.className = "bg-scan";
    // No src set here -- loaded via window.ModelCache below (queued,
    // Cache-API-backed) instead of letting each of these 10 elements
    // fire its own immediate fetch. With the 10 foreground gallery cards
    // doing the same thing at the same time, ~20 simultaneous multi-MB
    // GLB fetches split available bandwidth so many ways that most never
    // finished loading at all (confirmed by isolating one: it loaded in
    // ~14s alone vs. still stuck after 15s+ with everything competing).
    mv.setAttribute("poster", "models/bg_scans/" + s.file + ".png");
    mv.setAttribute("reveal", "auto");
    mv.setAttribute("disable-zoom", "");
    // Default auto-framing leaves a lot of margin around a compact point
    // cloud -- barely visible on a 210px foreground card, very visible
    // blown up near-fullscreen as a background. camera-orbit here is
    // overwritten every tick by applySunLook() below (real sun azimuth).
    mv.setAttribute("camera-orbit", "0deg 75deg 60%");
    mv.setAttribute("field-of-view", "15deg");
    mv.setAttribute("interaction-prompt", "none");
    mv.setAttribute("shadow-intensity", "0");
    mv.setAttribute("exposure", "1");
    wrap.appendChild(mv);
    viewers.push(mv);

    root.appendChild(wrap);
    wraps.push(wrap);

    var label = document.createElement("div");
    label.className = "bg-label";
    label.textContent = s.file + "_pi3x.glb · " + s.pts.toLocaleString("en-US") + " pts";
    root.appendChild(label);
    labels.push(label);

    if (window.ModelCache) {
      window.ModelCache.loadInto(mv, HF_BASE + s.file + "_pi3x.glb", i === 0);
    }
  });

  document.body.insertBefore(root, document.body.firstChild);

  // #bg-carousel sits at z-index:-1 (deliberately, to stay behind the
  // bare non-positioned <h1>/status-window -- see bg-carousel.css) which
  // means it establishes its own stacking context: no z-index set on a
  // descendant, however high, can ever escape it to render above the
  // rest of the page, and (separately) it puts the whole subtree in a
  // lower hit-testing layer than normal static page content -- a button
  // living in there is not reliably clickable no matter its own z-index,
  // confirmed via elementFromPoint() while debugging this the first time
  // (the bare <h1>'s invisible full-width box was swallowing the click).
  // The controls frame below lives in its own top-level overlay instead.
  var overlayRoot = document.createElement("div");
  overlayRoot.id = "bg-scan-overlay-root";
  document.body.appendChild(overlayRoot);

  // All three controls (enlarge, prev/next, download) live inside this
  // one frame, positioned/sized to exactly match .bg-scan-wrap's own box
  // (see the matching values in bg-carousel.css) -- rather than each
  // being independently `position: fixed` at viewport-relative
  // coordinates that merely happened to line up with the window's
  // corner.
  var controls = document.createElement("div");
  controls.id = "bg-scan-controls";
  overlayRoot.appendChild(controls);

  var triggerBtn = document.createElement("button");
  triggerBtn.id = "bg-scan-trigger";
  triggerBtn.type = "button";
  triggerBtn.setAttribute("aria-label", "Enlarge current background scan");
  triggerBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 3 3 3 3 9"></polyline><polyline points="15 3 21 3 21 9"></polyline><polyline points="3 15 3 21 9 21"></polyline><polyline points="21 15 21 21 15 21"></polyline></svg>';
  triggerBtn.addEventListener("click", function () {
    var s = scans[index];
    if (window.openModelModal) {
      window.openModelModal(HF_BASE + s.file + "_pi3x.glb", s.file, true);
    }
  });
  controls.appendChild(triggerBtn);

  // Manual prev/next, below the enlarge trigger, and a download button
  // below that for whichever scan is currently showing.
  var navGroup = document.createElement("div");
  navGroup.id = "bg-scan-nav";

  var prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "bg-scan-nav-btn";
  prevBtn.setAttribute("aria-label", "Previous background scan");
  prevBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  prevBtn.addEventListener("click", function () { manualGoTo((index - 1 + scans.length) % scans.length); });

  var nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "bg-scan-nav-btn";
  nextBtn.setAttribute("aria-label", "Next background scan");
  nextBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  nextBtn.addEventListener("click", function () { manualGoTo((index + 1) % scans.length); });

  navGroup.appendChild(prevBtn);
  navGroup.appendChild(nextBtn);
  controls.appendChild(navGroup);

  var downloadBtn = document.createElement("a");
  downloadBtn.id = "bg-scan-download";
  downloadBtn.setAttribute("aria-label", "Download current background scan");
  downloadBtn.setAttribute("download", "");
  downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><polyline points="7 11 12 16 17 11"></polyline><line x1="4" y1="21" x2="20" y2="21"></line></svg>';
  controls.appendChild(downloadBtn);

  function updateDownloadTarget() {
    var s = scans[index];
    downloadBtn.href = HF_BASE + s.file + "_pi3x.glb";
    downloadBtn.setAttribute("download", s.file + "_pi3x.glb");
  }
  // Not called here: `index` (declared with the carousel-advance logic
  // further down) is only hoisted at this point, not yet assigned 0 --
  // scans[undefined].file threw "Cannot read properties of undefined"
  // when this ran immediately. Called once index actually has a value.

  wraps[0].classList.add("is-current");
  labels[0].classList.add("is-current");

  // ---- sun-driven exposure/tint/camera-orbit, recomputed every 60s
  // (real sun position barely moves minute to minute) ----
  function applySunLook() {
    if (!window.SunLighting) return;
    var look = window.SunLighting.computeLook();
    viewers.forEach(function (mv) {
      mv.setAttribute("exposure", look.exposure);
      // A custom property, not mv.style.filter directly: the crossfade's
      // blur-in/out also lives on `filter` (see bg-carousel.css), and a
      // plain inline style.filter here would silently clobber it since
      // inline styles win outright. The CSS composes both into one
      // filter: var(--sun-filter) blur(...).
      mv.style.setProperty("--sun-filter", look.filter);
      mv.setAttribute("camera-orbit", look.cameraOrbit);
    });
  }
  applySunLook();
  setInterval(applySunLook, 60000);

  // ---- carousel auto-advance + shared goTo (auto and manual both use this) ----
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0;
  var carouselTimer = null;
  updateDownloadTarget();

  function goTo(next) {
    wraps[index].classList.remove("is-current");
    labels[index].classList.remove("is-current");
    wraps[next].classList.add("is-current");
    labels[next].classList.add("is-current");
    index = next;
    updateDownloadTarget();
  }

  // Prev/next buttons: jump immediately, then restart the auto-advance
  // timer from zero so it doesn't fire again a moment later mid-navigation.
  function manualGoTo(next) {
    goTo(next);
    if (!reduceMotion) {
      stopCarousel();
      startCarousel();
    }
  }

  function startCarousel() {
    if (reduceMotion || carouselTimer) return;
    carouselTimer = setInterval(function () {
      goTo((index + 1) % scans.length);
    }, 4200);
  }
  function stopCarousel() {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }

  startCarousel();
})();
