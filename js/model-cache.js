// Shared GLB loading for both the foreground gallery cards and the
// background scan carousel: caches each model via the Cache API (so a
// repeat view -- navigating the carousel back to a scan already seen, or
// just reloading the page -- is instant instead of re-fetching), and
// queues loads through a small concurrency limit instead of letting
// every model-viewer fire its own fetch at once.
//
// The concurrency limit matters more than the caching does for the
// *first* page load: with ~20 model-viewers (10 gallery cards + 10
// background scans) all firing simultaneously, real multi-MB GLB fetches
// end up splitting available bandwidth so many ways that most of them
// crawl at a fraction of their solo speed and never finish within any
// reasonable wait -- confirmed by isolating a single stuck model (all
// others' src removed): it loaded in ~14s alone, vs. still not loaded
// after 15s+ with everything competing. Caching alone wouldn't have
// fixed that first-load problem; it only helps on repeat visits.
window.ModelCache = (function () {
  "use strict";

  var CACHE_NAME = "models-cache";
  var MAX_CONCURRENT = 4;
  var queue = [];
  var active = 0;

  function pump() {
    while (active < MAX_CONCURRENT && queue.length > 0) {
      var job = queue.shift();
      active++;
      runJob(job).then(function () {
        active--;
        pump();
      });
    }
  }

  function runJob(job) {
    return caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(job.url).then(function (cached) {
        if (cached) return cached.blob();
        return fetch(job.url).then(function (resp) {
          // Awaited, not fire-and-forget: an unawaited cache.put() racing
          // a .blob() read on the sibling clone reliably hangs .blob()
          // forever in this Chromium build -- the exact bug found (and
          // fixed the same way) in js/app.js's modal loader.
          return cache.put(job.url, resp.clone()).then(function () {
            return resp.blob();
          });
        });
      });
    }).then(function (blob) {
      var objectUrl = URL.createObjectURL(blob);
      job.mv.setAttribute("src", objectUrl);
      job.resolve(objectUrl);
    }).catch(function (err) {
      console.warn("ModelCache: falling back to direct src for", job.url, err);
      job.mv.setAttribute("src", job.url); // let model-viewer fetch it directly
      job.resolve(job.url);
    });
  }

  function loadInto(mv, url, priority) {
    return new Promise(function (resolve) {
      var job = { mv: mv, url: url, resolve: resolve };
      // The background carousel's first scan needs to load promptly --
      // it's the one actually on screen -- but its script runs `defer`,
      // after the 10 foreground cards have already queued themselves.
      // Plain FIFO would leave it waiting behind all of them (confirmed:
      // 0 background completions at 20s while tiles were progressing).
      if (priority) queue.unshift(job); else queue.push(job);
      pump();
    });
  }

  return { loadInto: loadInto };
})();
