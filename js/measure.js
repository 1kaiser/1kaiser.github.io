// Click-to-measure distance tool for <model-viewer>, built entirely on its
// own public raycast API (positionAndNormalFromPoint) and hotspot system --
// model-viewer deliberately does not expose its internal Three.js scene, so
// this is the supported integration surface rather than a literal port of
// Potree's MeasuringTool (which reaches into Potree's own internal scene
// graph and has no equivalent public hook to attach to here).
//
// Caveat that matters for the Pi3X/VGGT scans this site shows: monocular
// reconstruction has no metric anchor, so raw distances are in the GLB's
// own arbitrary scale, not meters, unless calibrate() has been run first.
window.ModelMeasure = (function () {
  "use strict";

  var state = new WeakMap(); // model-viewer element -> per-instance state

  function ensureState(mv) {
    var s = state.get(mv);
    if (!s) {
      s = {
        active: false,
        points: [],
        scale: null,
        unit: "model units (uncalibrated)",
        onClick: null,
        onCameraChange: null,
        svg: null,
        line: null,
      };
      state.set(mv, s);
    }
    return s;
  }

  // model-viewer only auto-positions slotted children whose `slot`
  // attribute starts with "hotspot" -- anything else is inert.
  function hotspotSelector(name) {
    return '[slot="hotspot-' + name + '"]';
  }

  function clearHotspots(mv, s) {
    ["measure-a", "measure-b", "measure-label"].forEach(function (name) {
      var el = mv.querySelector(hotspotSelector(name));
      if (el) el.remove();
    });
    if (s.line) {
      s.line.setAttribute("x1", -10);
      s.line.setAttribute("y1", -10);
      s.line.setAttribute("x2", -10);
      s.line.setAttribute("y2", -10);
    }
    s.points = [];
  }

  function makeHotspot(mv, name, position, className) {
    var el = document.createElement("div");
    el.slot = "hotspot-" + name;
    el.className = "measure-hotspot " + (className || "");
    el.dataset.position = position.x + " " + position.y + " " + position.z;
    el.dataset.normal = "0 1 0";
    mv.appendChild(el);
    return el;
  }

  function ensureOverlay(mv) {
    var s = ensureState(mv);
    if (s.svg) return s.svg;
    // Anchors to the model-viewer's own parent, which needs
    // position:relative -- true for .modal (css/styles.css) and for the
    // gallery-card/bg-scan wrappers.
    var container = mv.parentElement;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "measure-overlay");
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("stroke", "#ff5252");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-dasharray", "6 4");
    line.setAttribute("x1", -10);
    line.setAttribute("y1", -10);
    line.setAttribute("x2", -10);
    line.setAttribute("y2", -10);
    svg.appendChild(line);
    (container || mv).appendChild(svg);
    s.svg = svg;
    s.line = line;
    return svg;
  }

  function updateLine(mv) {
    var s = state.get(mv);
    if (!s || !s.line || s.points.length < 2) return;
    var containerRect = (s.svg.parentElement || mv).getBoundingClientRect();
    var a = mv.querySelector(hotspotSelector("measure-a"));
    var b = mv.querySelector(hotspotSelector("measure-b"));
    if (!a || !b) return;
    var ra = a.getBoundingClientRect();
    var rb = b.getBoundingClientRect();
    s.line.setAttribute("x1", ra.left + ra.width / 2 - containerRect.left);
    s.line.setAttribute("y1", ra.top + ra.height / 2 - containerRect.top);
    s.line.setAttribute("x2", rb.left + rb.width / 2 - containerRect.left);
    s.line.setAttribute("y2", rb.top + rb.height / 2 - containerRect.top);
  }

  function dist(p1, p2) {
    var dx = p1.x - p2.x, dy = p1.y - p2.y, dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function handleClick(mv, event) {
    var s = ensureState(mv);
    if (!s.active) return;
    if (typeof mv.positionAndNormalFromPoint !== "function") {
      console.warn("ModelMeasure: this model-viewer build has no positionAndNormalFromPoint() -- update @google/model-viewer.");
      return;
    }
    var rect = mv.getBoundingClientRect();
    var hit = mv.positionAndNormalFromPoint(event.clientX - rect.left, event.clientY - rect.top);
    if (!hit) return; // click missed the model/point cloud surface entirely

    if (s.points.length >= 2) clearHotspots(mv, s);

    s.points.push(hit.position);
    if (s.points.length === 1) {
      makeHotspot(mv, "measure-a", hit.position, "measure-point");
    } else {
      makeHotspot(mv, "measure-b", hit.position, "measure-point");
      var raw = dist(s.points[0], s.points[1]);
      var shown = s.scale ? raw * s.scale : raw;
      var mid = {
        x: (s.points[0].x + s.points[1].x) / 2,
        y: (s.points[0].y + s.points[1].y) / 2,
        z: (s.points[0].z + s.points[1].z) / 2,
      };
      var label = makeHotspot(mv, "measure-label", mid, "measure-label");
      label.textContent = shown.toFixed(3) + " " + s.unit;
      ensureOverlay(mv);
      updateLine(mv);
    }
  }

  function attach(mv) {
    var s = ensureState(mv);
    if (s.onClick) return; // already attached
    s.onClick = function (e) { handleClick(mv, e); };
    s.onCameraChange = function () { updateLine(mv); };
    mv.addEventListener("click", s.onClick);
    mv.addEventListener("camera-change", s.onCameraChange);
    window.addEventListener("resize", s.onCameraChange);
  }

  function detach(mv) {
    var s = state.get(mv);
    if (!s) return;
    if (s.onClick) mv.removeEventListener("click", s.onClick);
    if (s.onCameraChange) {
      mv.removeEventListener("camera-change", s.onCameraChange);
      window.removeEventListener("resize", s.onCameraChange);
    }
    clearHotspots(mv, s);
    if (s.svg && s.svg.parentElement) s.svg.parentElement.removeChild(s.svg);
    state.delete(mv);
  }

  function toggle(mv) {
    attach(mv);
    var s = ensureState(mv);
    s.active = !s.active;
    if (!s.active) clearHotspots(mv, s);
    return s.active;
  }

  function isActive(mv) {
    var s = state.get(mv);
    return !!(s && s.active);
  }

  // Click two points of a KNOWN real-world distance (in meters) first,
  // then call calibrate(mv, realMeters) to convert subsequent readings
  // from arbitrary model units into meters for this model-viewer instance.
  function calibrate(mv, realWorldMeters) {
    var s = state.get(mv);
    if (!s || s.points.length < 2) return false;
    var raw = dist(s.points[0], s.points[1]);
    if (raw <= 0) return false;
    s.scale = realWorldMeters / raw;
    s.unit = "m";
    return true;
  }

  return { attach: attach, detach: detach, toggle: toggle, isActive: isActive, calibrate: calibrate };
})();
