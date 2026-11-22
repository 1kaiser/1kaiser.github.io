// Shared GLB loading and Cache API persistence across homepage gallery cards,
// modal viewer, background scan carousel, and the Three.js 3D Desktop stage.
// Buffers resp.arrayBuffer() first and returns a Blob URL immediately so heavy
// meshes render right away, then persists Response(blob) into Cache API
// asynchronously without tee-stream contention or synchronous disk-write stalls.
window.ModelCache = (function () {
  "use strict";

  var CACHE_NAME = "models-cache";
  var MAX_CONCURRENT = 4;
  var queue = [];
  var active = 0;
  var inflight = new Map();
  var blobUrls = new Map();

  function normalizeKey(url) {
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return String(url || "");
    }
  }

  function pump() {
    while (active < MAX_CONCURRENT && queue.length > 0) {
      var job = queue.shift();
      active++;
      fetchAndCache(job.key, job.url)
        .then(function (resolvedUrl) {
          job.resolve(resolvedUrl);
        })
        .catch(function (err) {
          console.warn("ModelCache: falling back to direct src for", job.url, err);
          job.resolve(job.url);
        })
        .finally(function () {
          active--;
          pump();
        });
    }
  }

  function persistInBackground(cache, key, blob) {
    try {
      var stored = new Response(blob, {
        status: 200,
        headers: { "Content-Type": blob.type || "model/gltf-binary" }
      });
      cache.put(key, stored).catch(function () {});
    } catch (e) {}
  }

  function fetchAndCache(key, url) {
    if (blobUrls.has(key)) {
      return Promise.resolve(blobUrls.get(key));
    }
    var hasCache = typeof window.caches !== "undefined";
    var cachePromise = hasCache
      ? caches.open(CACHE_NAME).catch(function () { return null; })
      : Promise.resolve(null);

    return cachePromise.then(function (cache) {
      var matchPromise = cache
        ? cache.match(key).catch(function () { return null; })
        : Promise.resolve(null);

      return matchPromise.then(function (cached) {
        if (cached) return cached.blob();
        return fetch(url).then(function (resp) {
          if (!resp.ok) throw new Error("HTTP " + resp.status + " for " + url);
          var ctype = resp.headers.get("Content-Type") || "model/gltf-binary";
          return resp.arrayBuffer().then(function (buf) {
            var blob = new Blob([buf], { type: ctype });
            if (cache) persistInBackground(cache, key, blob);
            return blob;
          });
        });
      });
    }).then(function (blob) {
      var objectUrl = URL.createObjectURL(blob);
      blobUrls.set(key, objectUrl);
      return objectUrl;
    });
  }

  function getBlobUrl(url, priority) {
    var key = normalizeKey(url);
    if (blobUrls.has(key)) {
      return Promise.resolve(blobUrls.get(key));
    }
    if (inflight.has(key)) {
      return inflight.get(key);
    }
    var p = new Promise(function (resolve) {
      var job = { key: key, url: url, resolve: resolve };
      if (priority) queue.unshift(job);
      else queue.push(job);
      pump();
    }).then(function (res) {
      inflight.delete(key);
      return res;
    });
    inflight.set(key, p);
    return p;
  }

  function loadInto(mv, url, priority) {
    return getBlobUrl(url, priority).then(function (resolvedUrl) {
      if (mv && typeof mv.setAttribute === "function") {
        mv.setAttribute("src", resolvedUrl);
      }
      return resolvedUrl;
    });
  }

  return {
    getBlobUrl: getBlobUrl,
    loadInto: loadInto,
    prefetch: function (url, priority) { return getBlobUrl(url, priority); }
  };
})();
