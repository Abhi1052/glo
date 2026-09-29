/* Chamku "Listen only" player.
   - One audio element lives outside the page, so the story keeps playing when the phone is locked
     or the parent moves to another page.
   - Lock-screen / notification controls: play, pause, next story (Media Session).
   - Watching a video and locking the phone: the sound carries on from the same second (best effort).
   - Nothing plays by itself at the end of a story (it is bedtime). */
(function () {
  var A = document.createElement("audio");
  A.id = "chamku-audio"; A.preload = "none"; A.setAttribute("playsinline", ""); A.setAttribute("webkit-playsinline", "");
  document.body.appendChild(A);
  var cur = null, handoff = null, mini = null;

  function T(k) { return window.chamkuT ? window.chamkuT(k) : k; }
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function hashId() { var m = location.hash.match(/^#\/s\/([^/?]+)/); return m ? decodeURIComponent(m[1]) : ""; }
  function box() { return document.querySelector(".listen"); }
  function tracked() { if (!A.__ca && window.ChamkuAuth && window.ChamkuAuth.track) window.ChamkuAuth.track(A); }

  function load(id, at) {
    var info = window.chamkuInfo && window.chamkuInfo(id);
    if (!info || !info.vid) return false;
    if (cur && cur.id === id && A.getAttribute("src")) return true;
    tracked();
    A.dispatchEvent(new Event("chamku:switch"));
    cur = info;
    A.setAttribute("data-story", id);
    A.src = info.vid;
    if (at) { A.__startAt = at; try { A.currentTime = at; } catch (e) {} A.addEventListener("loadedmetadata", function f() { A.removeEventListener("loadedmetadata", f); if (A.currentTime < at - 2) A.currentTime = at; }); }
    meta();
    return true;
  }
  function meta() {
    if (!("mediaSession" in navigator) || !cur) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: cur.title, artist: "Chamku", album: T("mAlbum"),
        artwork: [{ src: location.origin + "/icon-512.webp", sizes: "512x512", type: "image/webp" },
                  { src: location.origin + "/apple-touch-icon.jpg", sizes: "180x180", type: "image/jpeg" }]
      });
    } catch (e) {}
  }
  function play() { var p = A.play(); if (p && p.catch) p.catch(function () {}); }
  function nextId(fromId) { var ids = window.chamkuMore ? window.chamkuMore(fromId) : []; return ids[0] || null; }
  function next(fromId) {
    var id = nextId(fromId || (cur && cur.id) || hashId());
    if (!id || !load(id)) return;
    play();
    if (/^#\/s\//.test(location.hash)) location.hash = "#/s/" + id;   // the page follows the story
    paint();
  }
  function restart() { if (cur) { A.currentTime = 0; play(); } }

  if ("mediaSession" in navigator) {
    var ms = navigator.mediaSession;
    [["play", play], ["pause", function () { A.pause(); }], ["nexttrack", function () { next(); }], ["previoustrack", restart], ["stop", function () { A.pause(); }]]
      .forEach(function (h) { try { ms.setActionHandler(h[0], h[1]); } catch (e) {} });
  }

  /* ---------- drawing ---------- */
  function paint() {
    var b = box();
    if (b) {
      var mine = cur && cur.id === b.getAttribute("data-id");
      var d = mine ? (A.duration || 0) : 0, c = mine ? A.currentTime : 0;
      var pb = b.querySelector(".lp-play"); pb.textContent = mine && !A.paused ? "❚❚" : "▶"; pb.setAttribute("aria-label", mine && !A.paused ? "Pause" : "Play");
      var sk = b.querySelector(".lp-seek"); if (!sk.__drag) { sk.max = d || 100; sk.value = c; }
      b.querySelector(".lp-cur").textContent = fmt(c); b.querySelector(".lp-dur").textContent = d ? fmt(d) : "";
    }
    drawMini();
    if ("mediaSession" in navigator) try { navigator.mediaSession.playbackState = cur ? (A.paused ? "paused" : "playing") : "none"; } catch (e) {}
  }
  function drawMini() {
    var b = box();
    var show = cur && A.getAttribute("src") && (!A.paused || A.currentTime > 1) && !(b && b.getAttribute("data-id") === cur.id);
    if (!show) { if (mini) { mini.remove(); mini = null; document.body.classList.remove("has-mini"); } return; }
    if (!mini) {
      mini = document.createElement("div"); mini.className = "lp-mini";
      mini.innerHTML = '<a class="lp-mi" href="#"></a><a class="lp-mt" href="#"></a>' +
        '<button type="button" data-lp="mplay" aria-label="Play or pause"></button><button type="button" data-lp="mnext" aria-label="Next story">⏭</button><button type="button" data-lp="mclose" aria-label="Close">✕</button>';
      document.body.appendChild(mini); document.body.classList.add("has-mini");
    }
    mini.querySelector(".lp-mi").textContent = cur.icon; mini.querySelector(".lp-mi").href = "#/s/" + cur.id;
    mini.querySelector(".lp-mt").textContent = cur.title; mini.querySelector(".lp-mt").href = "#/s/" + cur.id;
    mini.querySelector('[data-lp="mplay"]').textContent = A.paused ? "▶" : "❚❚";
  }
  ["play", "pause", "timeupdate", "loadedmetadata", "ended", "emptied"].forEach(function (e) { A.addEventListener(e, paint); });

  /* ---------- buttons ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-lp]"); if (!el) return;
    var k = el.getAttribute("data-lp"), b = box(), id = b && b.getAttribute("data-id");
    e.preventDefault();
    if (k === "mode") {
      var m = el.getAttribute("data-m"), v = document.querySelector("video.player"), t0 = v && !v.paused ? v.currentTime : 0;
      try { localStorage.setItem("glo.mode", m); } catch (x) {}
      if (v) v.pause();
      var wasListening = cur && !A.paused ? A.currentTime : 0;
      if (m === "watch" && cur && cur.id === hashId()) A.pause();
      if (window.chamkuRender) window.chamkuRender();
      if (m === "listen" && t0) { if (load(hashId(), t0)) play(); }
      if (m === "watch" && wasListening) { var nv = document.querySelector("video.player"); if (nv) { nv.currentTime = wasListening; nv.play().catch(function () {}); } }
      paint(); return;
    }
    if (k === "play" && id) { if (!cur || cur.id !== id) load(id); if (A.paused) play(); else A.pause(); }
    else if (k === "next" && id) next(id);
    else if (k === "mplay") { if (A.paused) play(); else A.pause(); }
    else if (k === "mnext") next();
    else if (k === "mclose") { A.pause(); A.dispatchEvent(new Event("chamku:switch")); A.removeAttribute("src"); A.load(); cur = null; }
    paint();
  });
  document.addEventListener("input", function (e) {
    if (!e.target.classList || !e.target.classList.contains("lp-seek")) return;
    var b = box(); if (!b || !cur || cur.id !== b.getAttribute("data-id")) return;
    A.currentTime = Number(e.target.value) || 0;
  });
  ["pointerdown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.target.classList && e.target.classList.contains("lp-seek")) e.target.__drag = true; }, { passive: true }); });
  ["pointerup", "touchend", "change"].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.target.classList && e.target.classList.contains("lp-seek")) e.target.__drag = false; }, { passive: true }); });

  // page re-drawn (new story opened etc.): refresh the listen box and mini bar
  new MutationObserver(function () { clearTimeout(A.__t); A.__t = setTimeout(paint, 60); }).observe(document.getElementById("app"), { childList: true });

  /* ---------- watching a video and the phone gets locked: carry on as sound ---------- */
  document.addEventListener("visibilitychange", function () {
    var v = document.querySelector("video.player");
    if (document.visibilityState === "hidden") {
      if (v && !v.paused && !v.ended && hashId()) {
        var t0 = v.currentTime, from = v.__caDoc;
        if (!load(hashId(), t0)) return;
        A.dispatchEvent(new Event("chamku:switch"));      // the carried-on sound gets its own record, linked to the video's
        try { A.currentTime = t0; } catch (e) {}
        A.__startAt = t0; A.__contOf = from || null;
        var p = A.play();
        if (p && p.then) p.then(function () { v.pause(); handoff = v; }).catch(function () {});
      }
    } else if (handoff) {
      var hv = handoff; handoff = null;
      if (document.contains(hv) && cur && cur.id === hashId() && !A.paused) {
        hv.currentTime = A.currentTime; A.pause(); hv.play().catch(function () {});
      }
    }
  });

  window.ChamkuPlayer = { audio: A, next: next, load: load, current: function () { return cur; } };
})();

/* Mark a story as watched once half of it has been played (video or listen mode). Saved on this phone only. */
(function () {
  function mark(id) {
    if (!id) return;
    try { var w = JSON.parse(localStorage.getItem("glo.watched") || "{}"); if (!w[id]) { w[id] = Date.now(); localStorage.setItem("glo.watched", JSON.stringify(w)); } } catch (e) {}
  }
  function idOf(v) { var m = location.hash.match(/^#\/s\/([^/?]+)/); return v.getAttribute("data-story") || (m ? decodeURIComponent(m[1]) : ""); }
  document.addEventListener("timeupdate", function (e) {
    var v = e.target; if (!v || !(v.tagName === "VIDEO" || v.tagName === "AUDIO") || !v.duration) return;
    if (v.currentTime >= v.duration * 0.5) mark(idOf(v));
  }, true);
  document.addEventListener("ended", function (e) { var v = e.target; if (v && (v.tagName === "VIDEO" || v.tagName === "AUDIO")) mark(idOf(v)); }, true);
})();
