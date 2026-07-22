// Background carousel: cycles the 10 Pi3X reconstruction scans behind the
// existing gallery, rendered live via <model-viewer> (same element the
// foreground cards use, already loaded -- no separate Three.js stack)
// rather than static posters, so real sun-position math can actually
// affect how they look via exposure + camera-orbit + a CSS tint, using
// js/sun-lighting.js. Each scan also has an enlarge button (top-right)
// that brings it to the front as an interactive, camera-controllable
// viewer, then restores it back to the ambient background on close.
(function () {
  "use strict";

  var HF_BASE = "https://huggingface.co/datasets/1kaiser/models/resolve/main/";

  var scans = [
    { file: "VID20230408091040", pts: 51636 },
    { file: "VID20230408092322", pts: 566905 },
    { file: "VID20230408092500", pts: 906245 },
    { file: "VID20230408095210", pts: 140899 },
    { file: "VID20230408100354", pts: 2926 },
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
  var lastCameraOrbit = "0deg 75deg 60%";
  var enlargedIndex = -1;

  scans.forEach(function (s, i) {
    var wrap = document.createElement("div");
    wrap.className = "bg-scan-wrap";

    var mv = document.createElement("model-viewer");
    mv.className = "bg-scan";
    mv.setAttribute("src", HF_BASE + s.file + "_pi3x.glb");
    mv.setAttribute("poster", "models/bg_scans/" + s.file + ".jpg");
    mv.setAttribute("loading", i === 0 ? "eager" : "lazy");
    mv.setAttribute("reveal", "auto");
    mv.setAttribute("disable-zoom", "");
    // Default auto-framing leaves a lot of margin around a compact point
    // cloud -- barely visible on a 210px foreground card, very visible
    // blown up near-fullscreen as a background. camera-orbit here is
    // overwritten every tick by applySunLook() below (real sun azimuth).
    mv.setAttribute("camera-orbit", lastCameraOrbit);
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
  });

  document.body.insertBefore(root, document.body.firstChild);

  // #bg-carousel sits at z-index:-1 (deliberately, to stay behind the
  // bare non-positioned <h1>/status-window -- see bg-carousel.css) which
  // means it establishes its own stacking context: no z-index set on a
  // descendant, however high, can ever escape it to render above the
  // rest of the page. To actually bring an enlarged viewer "to the
  // front" it has to be reparented out of #bg-carousel entirely, into
  // this separate top-level overlay appended directly to <body>.
  var overlayRoot = document.createElement("div");
  overlayRoot.id = "bg-scan-overlay-root";
  document.body.appendChild(overlayRoot);

  // The trigger button has the exact same problem the per-scan buttons
  // used to have if it lived inside #bg-carousel (see note above) -- so
  // it's a single shared button living in the overlay root instead,
  // always acting on whichever scan is currently visible.
  var triggerBtn = document.createElement("button");
  triggerBtn.id = "bg-scan-trigger";
  triggerBtn.type = "button";
  triggerBtn.setAttribute("aria-label", "Enlarge current background scan");
  triggerBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 3 3 3 3 9"></polyline><polyline points="15 3 21 3 21 9"></polyline><polyline points="3 15 3 21 9 21"></polyline><polyline points="21 15 21 21 15 21"></polyline></svg>';
  triggerBtn.addEventListener("click", function () {
    toggleEnlarge(index);
  });
  overlayRoot.appendChild(triggerBtn);

  wraps[0].classList.add("is-current");
  labels[0].classList.add("is-current");

  // ---- sun-driven exposure/tint/camera-orbit, recomputed every 60s
  // (real sun position barely moves minute to minute) ----
  function applySunLook() {
    if (!window.SunLighting) return;
    var look = window.SunLighting.computeLook();
    lastCameraOrbit = look.cameraOrbit;
    viewers.forEach(function (mv, i) {
      mv.setAttribute("exposure", look.exposure);
      // A custom property, not mv.style.filter directly: the crossfade's
      // blur-in/out also lives on `filter` (see bg-carousel.css), and a
      // plain inline style.filter here would silently clobber it since
      // inline styles win outright. The CSS composes both into one
      // filter: var(--sun-filter) blur(...).
      mv.style.setProperty("--sun-filter", look.filter);
      if (i !== enlargedIndex) mv.setAttribute("camera-orbit", look.cameraOrbit);
    });
  }
  applySunLook();
  setInterval(applySunLook, 60000);

  // ---- enlarge / restore ----
  function toggleEnlarge(i) {
    if (enlargedIndex === i) {
      closeEnlarged();
      return;
    }
    if (enlargedIndex !== -1) closeEnlarged();

    enlargedIndex = i;
    var wrap = wraps[i];
    var mv = viewers[i];
    overlayRoot.appendChild(wrap); // out of #bg-carousel's z-index:-1 context
    wrap.classList.add("is-enlarged");
    mv.setAttribute("camera-controls", "");
    mv.removeAttribute("disable-zoom");
    // Drop the tight camera-orbit/field-of-view tuned for the small,
    // heavily-cropped background frame -- carrying those into the much
    // larger modal left the model rendering tiny in one corner instead
    // of filling it. Falling back to model-viewer's own auto-framing
    // (no explicit camera-orbit/field-of-view at all) instead, exactly
    // like the foreground gallery cards already do successfully.
    mv.removeAttribute("camera-orbit");
    mv.removeAttribute("field-of-view");

    var closeBtn = document.createElement("button");
    closeBtn.className = "bg-scan-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="20" y2="20"></line><line x1="20" y1="4" x2="4" y2="20"></line></svg>';
    closeBtn.addEventListener("click", closeEnlarged);
    wrap.appendChild(closeBtn);

    triggerBtn.style.display = "none";
    stopCarousel();
  }

  function closeEnlarged() {
    if (enlargedIndex === -1) return;
    var wrap = wraps[enlargedIndex];
    var mv = viewers[enlargedIndex];
    wrap.classList.remove("is-enlarged");
    mv.removeAttribute("camera-controls");
    mv.setAttribute("disable-zoom", "");
    mv.setAttribute("field-of-view", "15deg");
    mv.setAttribute("camera-orbit", lastCameraOrbit);
    var closeBtn = wrap.querySelector(".bg-scan-close");
    if (closeBtn) closeBtn.remove();
    root.appendChild(wrap); // back into the background carousel
    enlargedIndex = -1;
    triggerBtn.style.display = "";
    startCarousel();
  }

  // Escape, or clicking the dimmed backdrop, closes the enlarged viewer
  // (same as clicking its own enlarge/close button again)
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && enlargedIndex !== -1) closeEnlarged();
  });
  overlayRoot.addEventListener("click", function (e) {
    if (e.target === overlayRoot) closeEnlarged();
  });

  // ---- carousel auto-advance ----
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0;
  var carouselTimer = null;

  function startCarousel() {
    if (reduceMotion || carouselTimer) return;
    carouselTimer = setInterval(function () {
      var next = (index + 1) % scans.length;
      wraps[index].classList.remove("is-current");
      labels[index].classList.remove("is-current");
      wraps[next].classList.add("is-current");
      labels[next].classList.add("is-current");
      index = next;
    }, 4200);
  }
  function stopCarousel() {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }

  startCarousel();
})();
