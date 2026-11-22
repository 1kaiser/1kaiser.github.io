// Background carousel: cycles the Pi3X reconstruction scans behind the
// existing gallery, rendered live via <model-viewer> and lit by
// js/sun-lighting.js. Loads scans lazily (current + next) via the shared
// window.ModelCache so initial page load never wastes bandwidth on all 8 scans,
// and wires direct handoffs to the modal viewer, 3D Desktop, and Potree.
(function () {
  "use strict";

  var HF_BASE = window.PI3X_HF_BASE || "https://huggingface.co/datasets/1kaiser/models/resolve/main/";
  var scans = (window.PI3X_SCANS && window.PI3X_SCANS.length)
    ? window.PI3X_SCANS
    : [
        { dir: "VID20230408092322",   file: "VID20230408092322", pts: 566905 },
        { dir: "VID20230408092500",   file: "VID20230408092500", pts: 906245 },
        { dir: "VID20230408095210",   file: "VID20230408095210", pts: 140899 },
        { dir: "VID20230408100423",   file: "VID20230408100423", pts: 117726 },
        { dir: "VID20230408111201",   file: "VID20230408111201", pts: 77622 },
        { dir: "VID20230408113045_1", file: "VID20230408113045", pts: 28408 },
        { dir: "VID20230408152015",   file: "VID20230408152015", pts: 1192779 },
        { dir: "VID20230408163443_2", file: "VID20230408163443", pts: 871261 }
      ];

  var root = document.createElement("div");
  root.id = "bg-carousel";

  var wraps = [];
  var viewers = [];
  var labels = [];
  var loadedSet = new Set();

  function scanGlbUrl(s) {
    return s.glbUrl || (HF_BASE + s.file + "_pi3x.glb");
  }

  function scanPosterUrl(s) {
    return "models/bg_scans/" + s.file + ".png";
  }

  function ensureLoaded(idx, priority) {
    var s = scans[idx];
    var mv = viewers[idx];
    if (!s || !mv || loadedSet.has(idx)) return;
    loadedSet.add(idx);
    if (window.ModelCache) {
      window.ModelCache.loadInto(mv, scanGlbUrl(s), !!priority);
    } else {
      mv.setAttribute("src", scanGlbUrl(s));
    }
  }

  scans.forEach(function (s, i) {
    var wrap = document.createElement("div");
    wrap.className = "bg-scan-wrap";

    var mv = document.createElement("model-viewer");
    mv.className = "bg-scan";
    mv.setAttribute("poster", scanPosterUrl(s));
    mv.setAttribute("reveal", "auto");
    mv.setAttribute("disable-zoom", "");
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
  });

  document.body.insertBefore(root, document.body.firstChild);

  var overlayRoot = document.createElement("div");
  overlayRoot.id = "bg-scan-overlay-root";
  document.body.appendChild(overlayRoot);

  var controls = document.createElement("div");
  controls.id = "bg-scan-controls";
  overlayRoot.appendChild(controls);

  var triggerBtn = document.createElement("button");
  triggerBtn.id = "bg-scan-trigger";
  triggerBtn.type = "button";
  triggerBtn.title = "Enlarge current Pi3X scan";
  triggerBtn.setAttribute("aria-label", "Enlarge current background scan");
  triggerBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 3 3 3 3 9"></polyline><polyline points="15 3 21 3 21 9"></polyline><polyline points="3 15 3 21 9 21"></polyline><polyline points="21 15 21 21 15 21"></polyline></svg>';
  triggerBtn.addEventListener("click", function () {
    var s = scans[index];
    if (window.openModelModal) {
      window.openModelModal(scanGlbUrl(s), s.file, true, {
        poster: scanPosterUrl(s),
        scanDir: s.dir
      });
    }
  });
  controls.appendChild(triggerBtn);

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
  downloadBtn.title = "Download current Pi3X GLB";
  downloadBtn.setAttribute("aria-label", "Download current background scan");
  downloadBtn.setAttribute("download", "");
  downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><polyline points="7 11 12 16 17 11"></polyline><line x1="4" y1="21" x2="20" y2="21"></line></svg>';
  controls.appendChild(downloadBtn);

  var desktopLink = document.createElement("a");
  desktopLink.id = "bg-scan-desktop";
  desktopLink.title = "Explore current scan in 3D Desktop";
  desktopLink.setAttribute("aria-label", "Open current scan in 3D Desktop");
  desktopLink.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>';
  controls.appendChild(desktopLink);

  var potreeLink = document.createElement("a");
  potreeLink.id = "bg-scan-potree";
  potreeLink.title = "Measure current scan in Potree";
  potreeLink.setAttribute("aria-label", "Open current scan in Potree measurement viewer");
  potreeLink.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 6H3v12h18V6z"></path><path d="M7 6v4"></path><path d="M11 6v2"></path><path d="M15 6v4"></path><path d="M19 6v2"></path></svg>';
  controls.appendChild(potreeLink);

  function updateScanLinks() {
    var s = scans[index];
    downloadBtn.href = scanGlbUrl(s);
    downloadBtn.setAttribute("download", s.file + "_pi3x.glb");
    desktopLink.href = "desktop/desktop.html?scan=" + encodeURIComponent(s.dir);
    potreeLink.href = "desktop/potree/index.html?scan=" + encodeURIComponent(s.dir);
  }

  wraps[0].classList.add("is-current");
  labels[0].classList.add("is-current");

  function applySunLook() {
    if (!window.SunLighting) return;
    var look = window.SunLighting.computeLook();
    viewers.forEach(function (mv) {
      mv.setAttribute("exposure", look.exposure);
      mv.style.setProperty("--sun-filter", look.filter);
      mv.setAttribute("camera-orbit", look.cameraOrbit);
    });
  }
  applySunLook();
  setInterval(applySunLook, 60000);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0;
  var carouselTimer = null;
  updateScanLinks();

  function startInitialPreload() {
    ensureLoaded(0, true);
    if (scans.length > 1) ensureLoaded(1, false);
  }
  if (document.readyState === "complete") {
    startInitialPreload();
  } else {
    window.addEventListener("load", startInitialPreload, { once: true });
  }

  function goTo(next) {
    wraps[index].classList.remove("is-current");
    labels[index].classList.remove("is-current");
    wraps[next].classList.add("is-current");
    labels[next].classList.add("is-current");
    index = next;
    updateScanLinks();
    ensureLoaded(next, true);
    ensureLoaded((next + 1) % scans.length, false);
  }

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
