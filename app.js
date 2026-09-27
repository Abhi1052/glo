/* Glo — bedtime stories web app (beta). Plain JS, no build step. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var nightlight = document.getElementById("nightlight");
  var DATA = null;
  var CAT = {};

  /* ---------- safe storage (can fail in private mode) ---------- */
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  var favs = load("glo.favs", []);
  var textSize = load("glo.size", 21);
  var filter = load("glo.filter", "all");

  function isFav(id) { return favs.indexOf(id) !== -1; }
  function toggleFav(id) {
    if (isFav(id)) favs = favs.filter(function (x) { return x !== id; });
    else favs.push(id);
    save("glo.favs", favs);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- tonight's story changes once a day ---------- */
  function tonightStory() {
    var d = new Date();
    var dayNumber = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    return DATA.stories[dayNumber % DATA.stories.length];
  }

  /* ---------- HOME ---------- */
  function renderHome() {
    resetDim();
    document.title = "ग्लो — सोने से पहले की कहानियाँ";
    var t = tonightStory();

    var chips = '<button class="chip" data-f="all" aria-pressed="' + (filter === "all") + '">सब कहानियाँ</button>' +
      '<button class="chip" data-f="fav" aria-pressed="' + (filter === "fav") + '">♥ मेरी पसंद</button>' +
      DATA.categories.map(function (c) {
        return '<button class="chip" data-f="' + c.id + '" aria-pressed="' + (filter === c.id) + '">' + esc(c.name) + "</button>";
      }).join("");

    var list = DATA.stories.filter(function (s) {
      if (filter === "all") return true;
      if (filter === "fav") return isFav(s.id);
      return s.category === filter;
    });

    var cards = list.map(function (s) {
      return '<a class="card" href="#/s/' + s.id + '">' +
        '<div class="num">' + s.num + "</div>" +
        "<div><h3>" + esc(s.title) + (isFav(s.id) ? '<span class="fav-mark">♥</span>' : "") + "</h3>" +
        '<div class="meta">' + esc(CAT[s.category] || "") + " · " + s.minutes + " मिनट · " + esc(s.age) + "</div>" +
        '<p class="sum">' + esc(s.summary) + "</p></div></a>";
    }).join("");

    var heading = filter === "all" ? "सारी कहानियाँ (" + list.length + ")" :
      filter === "fav" ? "मेरी पसंद (" + list.length + ")" : esc(CAT[filter]) + " (" + list.length + ")";

    app.innerHTML =
      '<div class="wrap">' +
      '<header class="top"><div class="brand"><div class="glo big"></div><div><h1>ग्लो</h1>' +
      "<p>हर रात लौट आने वाली रोशनी</p></div></div>" +
      '<span class="beta">बीटा</span></header>' +
      '<a class="tonight" href="#/s/' + t.id + '"><div class="label">आज रात की कहानी</div>' +
      "<h2>" + esc(t.title) + "</h2><p>" + esc(t.summary) + "</p>" +
      '<span class="pill">▶ शुरू करें</span></a>' +
      '<nav class="chips" aria-label="श्रेणियाँ">' + chips + "</nav>" +
      '<h2 class="section-title">' + heading + "</h2>" +
      (list.length ? '<div class="grid">' + cards + "</div>" :
        '<p class="empty">अभी यहाँ कोई कहानी नहीं है। किसी कहानी में ♥ दबाइए, वो यहाँ दिखेगी।</p>') +
      '<p class="foot">ग्लो बीटा · सिर्फ़ दोस्तों और परिवार के लिए · श्रेणियाँ और कहानियाँ अभी नमूना हैं</p>' +
      "</div>";

    app.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        filter = b.getAttribute("data-f");
        save("glo.filter", filter);
        renderHome();
      });
    });
    window.scrollTo(0, 0);
  }

  /* ---------- STORY ---------- */
  var maxProgress = 0;
  function resetDim() {
    maxProgress = 0;
    document.documentElement.style.setProperty("--dim", "1");
    document.body.style.background = "";
  }
  // The screen only ever gets darker while reading — it never brightens again.
  function onScroll() {
    var page = document.querySelector(".story-page");
    if (!page) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    if (p > maxProgress) {
      maxProgress = p;
      var dim = (1 - 0.45 * maxProgress).toFixed(3);
      document.documentElement.style.setProperty("--dim", dim);
      var shade = Math.round(38 - 30 * maxProgress);
      document.body.style.background = "rgb(" + Math.round(shade * 0.29) + "," + Math.round(shade * 0.42) + "," + shade + ")";
    }
  }

  function renderStory(id) {
    var s = DATA.stories.filter(function (x) { return x.id === id; })[0];
    if (!s) { location.hash = "#/"; return; }
    var body = DATA.bodies[s.body];
    resetDim();
    document.title = s.title + " — ग्लो";

    var parts = body.parts.map(function (p) {
      var lines = p.text.split("\n").map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("");
      return '<section class="part"><h2>' + esc(p.heading) + "</h2>" +
        '<div class="dir">(' + esc(p.direction) + ")</div>" + lines + "</section>";
    }).join("");

    var audio = s.audio
      ? '<audio controls preload="none" src="' + esc(s.audio) + '"></audio>'
      : '<div class="note"><strong>ग्लो की आवाज़ जल्द आ रही है।</strong> तब तक आप बच्चे को पढ़कर सुनाइए — धीरे-धीरे, प्यार से। ' +
        "हर हिस्से के ऊपर लिखा है कि कैसे पढ़ना है। जैसे-जैसे आप आगे पढ़ेंगे, स्क्रीन अपने आप धीमी होती जाएगी।</div>";

    var sampleNote = s.sample
      ? '<div class="note">यह <strong>नमूना</strong> है। असली कहानी बाद में आएगी — अभी यहाँ “' + esc(body.title) + "” खुल रही है।</div>"
      : "";

    app.innerHTML =
      '<div class="story-page"><div class="wrap">' +
      '<div class="bar"><a class="icon-btn" href="#/" aria-label="वापस">← वापस</a>' +
      '<div class="tools">' +
      '<button class="icon-btn" data-act="smaller" aria-label="अक्षर छोटे करें">अ−</button>' +
      '<button class="icon-btn" data-act="bigger" aria-label="अक्षर बड़े करें">अ+</button>' +
      '<button class="icon-btn" data-act="fav" aria-pressed="' + isFav(s.id) + '" aria-label="पसंद">♥</button>' +
      "</div></div>" +
      '<div class="story-head"><div class="glo big"></div><h1>' + esc(s.title) + "</h1>" +
      '<div class="meta">' + esc(CAT[s.category] || "") + " · " + s.minutes + " मिनट · " + esc(s.age) + "</div></div>" +
      sampleNote + audio + parts +
      '<div class="end"><div class="glo"></div><p>कहानी ख़त्म... अब सोने का समय।</p>' +
      '<button class="pill" data-act="night">🌙 रात की रोशनी चालू करें</button></div>' +
      "</div></div>";

    document.documentElement.style.setProperty("--story-size", textSize + "px");

    app.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.getAttribute("data-act");
        if (act === "bigger" || act === "smaller") {
          textSize = Math.max(16, Math.min(32, textSize + (act === "bigger" ? 2 : -2)));
          save("glo.size", textSize);
          document.documentElement.style.setProperty("--story-size", textSize + "px");
        } else if (act === "fav") {
          toggleFav(s.id);
          b.setAttribute("aria-pressed", String(isFav(s.id)));
        } else if (act === "night") {
          openNightlight();
        }
      });
    });
    window.scrollTo(0, 0);
  }

  /* ---------- NIGHT LIGHT: a small glow that slowly fades ---------- */
  var wakeLock = null;
  function openNightlight() {
    var dot = nightlight.querySelector(".nl-dot");
    var txt = nightlight.querySelector(".nl-text");
    [dot, txt].forEach(function (n) { n.style.animation = "none"; void n.offsetWidth; n.style.animation = ""; });
    nightlight.hidden = false;
    try {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    } catch (e) { /* ignore */ }
    try {
      if ("wakeLock" in navigator) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; }).catch(function () {});
    } catch (e) { /* ignore */ }
  }
  function closeNightlight() {
    nightlight.hidden = true;
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ }
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) { /* ignore */ }
  }
  nightlight.querySelector(".nl-exit").addEventListener("click", closeNightlight);

  /* ---------- ROUTER ---------- */
  function route() {
    var h = location.hash || "#/";
    var m = h.match(/^#\/s\/([\w-]+)/);
    if (m) renderStory(m[1]); else renderHome();
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("scroll", onScroll, { passive: true });

  fetch("stories.json", { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      DATA = d;
      d.categories.forEach(function (c) { CAT[c.id] = c.name; });
      route();
    })
    .catch(function () {
      app.innerHTML = '<div class="wrap"><p class="empty">कहानियाँ लोड नहीं हो पाईं। इंटरनेट चेक करके फिर से खोलिए।</p></div>';
    });

  /* ---------- offline support ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
