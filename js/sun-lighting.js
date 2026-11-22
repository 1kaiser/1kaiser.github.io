// Shared solar ephemeris math (Spencer, 1971 Fourier series declination +
// Equation of Time) driving both the homepage Pi3X background lighting and
// the 3D Desktop Sun-Path room simulator.
// Reference: Spencer, J. W. (1971), "Fourier series representation of the
// position of the Sun", Search 2(5):172.
(function () {
  "use strict";

  function solarPosition(lat, lon, doy, hour, opts) {
    opts = opts || {};
    var latR = (lat * Math.PI) / 180;
    var B = ((2 * Math.PI) / 365) * (doy - 1);

    // Declination (degrees -> radians)
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

    // Equation of Time (minutes)
    var eotMin =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(B) -
        0.032077 * Math.sin(B) -
        0.014615 * Math.cos(2 * B) -
        0.04089 * Math.sin(2 * B));

    var solarTime;
    if (opts.isUTC) {
      solarTime = hour + lon / 15 + (opts.applyEoT === false ? 0 : eotMin / 60);
    } else {
      var tzOffset =
        typeof opts.tzOffset === "number" ? opts.tzOffset : Math.round(lon / 15);
      solarTime =
        hour +
        (lon / 15 - tzOffset) +
        (opts.applyEoT === false ? 0 : eotMin / 60);
    }

    // Hour angle (negative morning, 0 solar noon, positive afternoon)
    var ha = ((solarTime - 12) * 15 * Math.PI) / 180;

    var sinAlt =
      Math.sin(latR) * Math.sin(declR) +
      Math.cos(latR) * Math.cos(declR) * Math.cos(ha);
    var altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

    // Azimuth from north clockwise (East ~90deg, South ~180deg, West ~270deg)
    var denom = Math.cos(latR) * Math.cos(altitude);
    var cosAz =
      Math.abs(denom) > 1e-6
        ? (Math.sin(declR) - Math.sin(latR) * sinAlt) / denom
        : 1;
    var azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(ha) > 0) azimuth = 2 * Math.PI - azimuth;

    return {
      altitude: altitude,
      azimuth: azimuth,
      declination: declR,
      eotMinutes: eotMin
    };
  }

  function dayOfYear(d) {
    d = d || new Date();
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

  // Default observatory coordinate (Delhi, 28.6 N, 77.2 E)
  var DEFAULT_LAT = 28.6;
  var DEFAULT_LON = 77.2;

  function computeLook(date) {
    date = date || new Date();
    var hour = date.getUTCHours() + date.getUTCMinutes() / 60;
    var pos = solarPosition(DEFAULT_LAT, DEFAULT_LON, dayOfYear(date), hour, {
      isUTC: true
    });
    var altDeg = (pos.altitude * 180) / Math.PI;
    var azDeg = (pos.azimuth * 180) / Math.PI;

    var t = clamp((altDeg + 10) / 60, 0, 1);
    var exposure = lerp(0.4, 1.2, t);

    var warmth = Math.exp(-Math.pow(altDeg - 8, 2) / (2 * 20 * 20));
    var sepia = (warmth * 0.4).toFixed(3);
    var saturate = lerp(1, 1.25, warmth).toFixed(3);

    var night = clamp(1 - t * 1.3, 0, 1);
    var brightness = lerp(1, 0.55, night).toFixed(3);
    var hueRotate = lerp(0, 205, night).toFixed(1);

    var phiDeg = clamp(90 - altDeg * 0.5, 55, 85);
    var cameraOrbit = azDeg.toFixed(1) + "deg " + phiDeg.toFixed(1) + "deg 60%";

    return {
      altitudeDeg: altDeg,
      azimuthDeg: azDeg,
      exposure: exposure.toFixed(3),
      filter:
        "sepia(" +
        sepia +
        ") saturate(" +
        saturate +
        ") brightness(" +
        brightness +
        ") hue-rotate(" +
        hueRotate +
        "deg)",
      cameraOrbit: cameraOrbit
    };
  }

  window.SunLighting = {
    computeLook: computeLook,
    solarPosition: solarPosition,
    dayOfYear: dayOfYear
  };
})();
