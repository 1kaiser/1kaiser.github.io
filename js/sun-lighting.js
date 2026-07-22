// Real sun-position math for the background scan carousel's lighting.
// Same astronomical algorithm as desktop/desktop.js's initSunPath tool
// (Spencer declination formula + equation of time) -- duplicated rather
// than shared as a module because desktop.js isn't loaded on index.html
// and the function is small/self-contained.
(function () {
  "use strict";

  function solarPosition(lat, lon, doy, hour) {
    var latR = (lat * Math.PI) / 180;
    var B = ((2 * Math.PI) / 365) * (doy - 1);
    var decl =
      (180 / Math.PI) *
      (0.006918 -
        0.399912 * Math.cos(B) +
        0.070257 * Math.sin(B) -
        0.006758 * Math.cos(2 * B) +
        0.000907 * Math.sin(2 * B) -
        0.002697 * Math.cos(3 * B) +
        0.00148 * Math.sin(3 * B));
    var declR = (decl * Math.PI) / 180;

    var solarNoon = 12 - lon / 15;
    var ha = ((hour - solarNoon) * 15 * Math.PI) / 180;

    var sinAlt = Math.sin(latR) * Math.sin(declR) + Math.cos(latR) * Math.cos(declR) * Math.cos(ha);
    var altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    // Azimuth, from south, clockwise (matches desktop.js's Sun-Path tool)
    var cosAz = (Math.sin(declR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.cos(altitude));
    var azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(ha) > 0) azimuth = 2 * Math.PI - azimuth;

    return { altitude: altitude, azimuth: azimuth };
  }

  function dayOfYear(d) {
    var start = Date.UTC(d.getUTCFullYear(), 0, 0);
    var now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return Math.floor((now - start) / 86400000);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // No geolocation prompt for a decorative background effect -- a fixed
  // default coordinate is enough to get a real, currently-correct sun
  // altitude -- computed from actual UTC + longitude below, not from
  // whatever timezone the visitor's OS/browser happens to be set to.
  var DEFAULT_LAT = 28.6;
  var DEFAULT_LON = 77.2;

  function computeLook(date) {
    date = date || new Date();
    // solarPosition's own `solarNoon = 12 - lon/15` term already converts
    // UTC to local solar time internally -- it wants a raw UTC hour in,
    // not one pre-adjusted for longitude (that would apply the
    // correction twice). Using UTC directly here, rather than
    // date.getHours() (the browser's own arbitrary local timezone),
    // means this is correct regardless of what timezone the visitor's
    // system clock is set to.
    var hour = date.getUTCHours() + date.getUTCMinutes() / 60;
    var pos = solarPosition(DEFAULT_LAT, DEFAULT_LON, dayOfYear(date), hour);
    var altDeg = (pos.altitude * 180) / Math.PI;
    var azDeg = (pos.azimuth * 180) / Math.PI;

    // 0 at altitude -10deg (well below horizon), 1 by altitude +50deg
    var t = clamp((altDeg + 10) / 60, 0, 1);
    var exposure = lerp(0.4, 1.2, t);

    // Golden-hour warmth peaks near altitude ~8deg (just above horizon),
    // fades out both toward night and toward high sun.
    var warmth = Math.exp(-Math.pow(altDeg - 8, 2) / (2 * 20 * 20));
    var sepia = (warmth * 0.4).toFixed(3);
    var saturate = lerp(1, 1.25, warmth).toFixed(3);

    // Night tint: dims and cools as altitude drops below the horizon.
    var night = clamp(1 - t * 1.3, 0, 1);
    var brightness = lerp(1, 0.55, night).toFixed(3);
    var hueRotate = lerp(0, 205, night).toFixed(1);

    // Camera-orbit theta driven directly by real sun azimuth: these point
    // clouds carry no vertex normals (trimesh's PointCloud export doesn't
    // write any), so there's no per-point surface to test a light against
    // and no compass calibration tying "azimuth" to a specific side of
    // any given reconstruction. Placing a literal light object and
    // hoping it stays on the model's lit side isn't reliable without
    // that. Steering the *camera* by the same real azimuth instead
    // sidesteps the problem by construction: the camera is always
    // looking from generally where the sun is, so there's no separate
    // light to end up hidden behind the geometry -- whatever's facing
    // the camera is, by definition, the sun-facing side.
    var phiDeg = clamp(90 - altDeg * 0.5, 55, 85); // sun higher -> slightly more overhead view
    var cameraOrbit = azDeg.toFixed(1) + "deg " + phiDeg.toFixed(1) + "deg 60%";

    return {
      altitudeDeg: altDeg,
      azimuthDeg: azDeg,
      exposure: exposure.toFixed(3),
      filter: "sepia(" + sepia + ") saturate(" + saturate + ") brightness(" + brightness + ") hue-rotate(" + hueRotate + "deg)",
      cameraOrbit: cameraOrbit
    };
  }

  window.SunLighting = { computeLook: computeLook };
})();
