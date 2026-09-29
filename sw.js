/* Chamku service worker — keeps the app working offline. Bump VERSION on every release. */
var VERSION = "chamku-09291839";
var SHELL = ["./", "index.html", "style.css", "app.js", "data.json", "manifest.webmanifest", "icon-192.webp", "icon-512.webp", "glo-face.webp", "glo-hero.webp"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (/\.mp4($|\?)/.test(req.url)) return; // videos stream straight from the server
  var url = new URL(req.url);
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return; // login, database and SDK go straight to the network
  // Story list and pages: try the network first so updates show up, fall back to the saved copy offline.
  if (url.origin === location.origin && (url.pathname.endsWith("data.json") || req.mode === "navigate")) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match("index.html"); }); })
    );
    return;
  }
  // Everything else (styles, script, icons, fonts, audio): saved copy first.
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok || res.type === "opaque") {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
