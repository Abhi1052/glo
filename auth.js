/* Chamku login + story play tracking.
   - Home page stays open. Pressing play on a story video asks the parent to sign in once
     (Google one-tap, or a sign-in link sent to their email). Firebase keeps them signed in on the phone.
   - For every play we save: who, which story, how far they got (2-min mark, 25/50/75%, finished).
   - #/report shows the per-story numbers to the admin emails only. */
(function () {
  var CFG = window.CHAMKU_AUTH || null;
  var ADMINS = (CFG && CFG.admins) || [];
  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  var ready = null, auth = null, db = null, user = null, waiting = [];

  function hi() { try { return JSON.parse(localStorage.getItem("glo.lang") || '"en"') === "hi"; } catch (e) { return false; } }
  function T(en, h) { return hi() ? h : en; }

  function load(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s);
    });
  }
  var gisLoad = null;
  function loadGis() {
    if (!gisLoad && CFG && CFG.googleClientId) gisLoad = load("https://accounts.google.com/gsi/client").then(function () { return true; }, function () { gisLoad = null; return false; });
    return gisLoad;
  }
  function warm() { loadGis(); init(); }
  if (CFG && CFG.firebase) { if (document.readyState === "complete") setTimeout(warm, 300); else window.addEventListener("load", function () { setTimeout(warm, 300); }); }

  /* in-app browsers (WhatsApp, Instagram, Facebook...) - Google blocks sign-in inside them */
  var UA = navigator.userAgent || "";
  var ANDROID = /Android/i.test(UA);
  var INAPP = /; wv\)|FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|LinkedInApp|Twitter|MicroMessenger|WhatsApp/i.test(UA) || (/iPhone|iPad/.test(UA) && !/Safari\//.test(UA));
  function chromeLink() { return "intent://" + location.host + location.pathname + "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(location.origin + location.pathname) + ";end"; }

  /* small log of sign-in attempts, so we can see where phones get stuck (no personal data: only the phone type and the step) */
  function slog(step, extra) {
    try {
      if (!db) return;
      var d = { step: step, ua: UA.slice(0, 180), inapp: INAPP, android: ANDROID, gis: !!(window.google && google.accounts && google.accounts.id), t: firebase.firestore.FieldValue.serverTimestamp() };
      if (extra) d.err = String(extra).slice(0, 120);
      db.collection("signin_log").add(d).catch(function () {});
    } catch (e) {}
  }

  function init() {
    if (ready) return ready;
    loadGis();
    if (!CFG || !CFG.firebase || !CFG.firebase.apiKey) { ready = Promise.resolve(false); return ready; }
    ready = load(SDK + "firebase-app-compat.js")
      .then(function () { return Promise.all([load(SDK + "firebase-auth-compat.js"), load(SDK + "firebase-firestore-compat.js")]); })
      .then(function () {
        firebase.initializeApp(CFG.firebase);
        auth = firebase.auth(); db = firebase.firestore();
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {});
        // finish an email-link sign-in if this page was opened from that link
        if (auth.isSignInWithEmailLink(location.href)) {
          var em = null; try { em = localStorage.getItem("chamku_em"); } catch (e) {}
          if (!em) em = prompt(T("Please type your email again to finish signing in", "Sign in पूरा करने के लिए अपना email फिर से लिखिए"));
          if (em) auth.signInWithEmailLink(em, location.href).then(function () {
            try { localStorage.removeItem("chamku_em"); } catch (e) {}
            history.replaceState(null, "", location.pathname + (localStorage.getItem("chamku_back") || "#/"));
          }).catch(function (e) { toast(T("That sign-in link has expired. Please try again.", "ये link पुराना हो गया। कृपया फिर से कोशिश करें।")); });
        }
        return new Promise(function (ok) {
          auth.onAuthStateChanged(function (u) {
            user = u; paintBadge();
            if (!u) {
              // nobody signed in: sign in silently without a name, so we can still see which stories get finished
              auth.signInAnonymously().catch(function () { ok(true); });
              return;
            }
            ok(true);
            loggedIn(u);
          });
        });
      }).catch(function () { return false; });
    return ready;
  }

  function real() { return !!(user && !user.isAnonymous); }
  function loggedIn(u) {
    user = u;
    db.collection("users").doc(u.uid).set({ email: u.email || "", name: u.displayName || "", provider: u.isAnonymous ? "anonymous" : ((u.providerData[0] || {}).providerId || "email"),
      lastSeen: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(function () {});
    if (u.isAnonymous) return;
    var w = waiting; waiting = []; w.forEach(function (f) { f(); });
    closeSheet();
  }

  /* ---------- sign-in sheet ---------- */
  var box = null;
  function toast(msg) { var m = box && box.querySelector("#ca-msg"); if (m) m.textContent = msg; }
  function closeSheet() { if (box) { box.remove(); box = null; } }
  function openSheet() {
    closeSheet();
    box = document.createElement("div");
    box.className = "ca-wrap";
    box.innerHTML = '<div class="ca-card" role="dialog" aria-modal="true"><img src="glo-face.webp" alt="" class="ca-img">' +
      "<h2>" + T("Sign in once to listen", "सुनने के लिए एक बार sign in करें") + "</h2>" +
      "<p>" + T("It's free while we are testing. You stay signed in on this phone.", "Testing के दौरान बिल्कुल free। इस फ़ोन पर आप signed in रहेंगे।") + "</p>" +
      (INAPP ? '<div class="ca-inapp">' + T("Google sign-in does not work inside this app's browser.", "इस app के अंदर वाले browser में Google sign-in नहीं चलता।") +
        (ANDROID ? ' <a class="pill wide" id="ca-chrome" href="' + chromeLink() + '">' + T("Open in Chrome", "Chrome में खोलें") + "</a>"
                 : " " + T("Tap ⋯ or the share button and choose “Open in Safari”.", "⋯ या share बटन दबाकर “Open in Safari” चुनें।")) + "</div>" : "") +
      '<div id="ca-gbtn" class="ca-gbtn"><span class="small muted">' + T("Loading Google sign-in…", "Google sign-in खुल रहा है…") + "</span></div>" +
      '<button class="pill wide ca-google" id="ca-g" style="display:none"><span class="ca-gl">G</span> ' + T("Continue with Google", "Google से आगे बढ़ें") + "</button>" +
      '<div class="ca-or">' + T("or", "या") + "</div>" +
      '<input id="ca-em" type="email" inputmode="email" autocomplete="email" placeholder="' + T("Your email", "आपका email") + '">' +
      '<button class="pill ghost wide" id="ca-e">' + T("Email me a sign-in link", "मुझे sign-in link भेजें") + "</button>" +
      '<p id="ca-msg" class="small muted"></p>' +
      '<p class="small muted">' + T("We only use your email to know who is listening and which stories work. No ads, never shared.",
        "आपका email सिर्फ़ ये जानने के लिए है कि कौन सुन रहा है और कौन-सी कहानी पसंद आ रही है। कोई ads नहीं, किसी से share नहीं।") +
      ' <a href="privacy.html">' + T("Privacy", "Privacy") + "</a></p>" +
      '<button class="link" id="ca-x">' + T("Not now", "अभी नहीं") + "</button></div>";
    document.body.appendChild(box);
    box.querySelector("#ca-x").onclick = closeSheet;
    box.addEventListener("click", function (e) { if (e.target === box) closeSheet(); });
    // Preferred: Google's own sign-in button (works on phones where the Firebase popup/redirect is blocked)
    slog("sheet");
    gisButton(box.querySelector("#ca-gbtn"), box.querySelector("#ca-g"));
    box.querySelector("#ca-g").onclick = function () {
      toast("…");
      var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
      auth.signInWithPopup(p).catch(function (e) {
        if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
          try { localStorage.setItem("chamku_back", location.hash); } catch (x) {}
          return auth.signInWithRedirect(p);
        }
        toast(e && e.code === "auth/popup-closed-by-user" ? "" : T("Could not sign in. Please try again.", "Sign in नहीं हो पाया। कृपया फिर से कोशिश करें।"));
      });
    };
    box.querySelector("#ca-e").onclick = function () {
      var em = (box.querySelector("#ca-em").value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast(T("Please type a valid email.", "कृपया सही email लिखिए।")); return; }
      try { localStorage.setItem("chamku_em", em); localStorage.setItem("chamku_back", location.hash); } catch (x) {}
      auth.sendSignInLinkToEmail(em, { url: location.origin + location.pathname, handleCodeInApp: true }).then(function () {
        toast(T("Link sent! Open your email on this phone and tap the link.", "Link भेज दिया! इसी फ़ोन पर अपना email खोलिए और link पर tap कीजिए।"));
      }).catch(function () { toast(T("Could not send the link. Please try again.", "Link नहीं भेज पाए। कृपया फिर से कोशिश करें।")); });
    };
  }

  var gisReady = false;
  function onGoogleCredential(resp) {
    toast("…"); slog("google_ok");
    var cred = firebase.auth.GoogleAuthProvider.credential(resp.credential);
    var step = user && user.isAnonymous
      ? user.linkWithCredential(cred).then(function (r) { return r; }, function (e) {
          if (e && /already-in-use/.test(e.code || "")) return auth.signInWithCredential(cred);
          throw e;
        })
      : auth.signInWithCredential(cred);
    step.then(function (r) { slog("signed_in"); var u = (r && r.user) || auth.currentUser; if (u) loggedIn(u); }).catch(function (e) {
      slog("firebase_err", e && (e.code || e.message));
      toast(T("Could not sign in. Please try again.", "Sign in नहीं हो पाया। कृपया फिर से कोशिश करें।") + (e && e.code ? " (" + e.code + ")" : ""));
    });
  }
  function gisButton(holder, fallback, tries) {
    tries = tries || 0;
    var g = window.google && google.accounts && google.accounts.id;
    if (!g || !CFG.googleClientId) {
      if (tries === 0) loadGis();
      if (tries < 100) { setTimeout(function () { gisButton(holder, fallback, tries + 1); }, 200); return; }
      slog("gis_timeout");
      holder.innerHTML = '<span class="small muted">' + T("Google sign-in could not load. Please use the email link below.", "Google sign-in नहीं खुल पाया। नीचे email link से sign in करें।") + "</span>";
      if (fallback && !/Android|iPhone|iPad/i.test(UA)) fallback.style.display = "";
      return;
    }
    if (!gisReady) { g.initialize({ client_id: CFG.googleClientId, callback: onGoogleCredential, ux_mode: "popup", auto_select: false, context: "signin",
      use_fedcm_for_prompt: true, itp_support: true, cancel_on_tap_outside: false }); gisReady = true; }
    // one tap: Google shows "Continue as <name>" at the bottom of the screen - a single tap signs in
    if (!real() && box) { try { g.prompt(function (n) { try { if (n.isSkippedMoment && n.isSkippedMoment()) slog("onetap_skipped", n.getSkippedReason && n.getSkippedReason()); } catch (x) {} }); slog("onetap_shown"); } catch (e) {} }
    holder.innerHTML = "";
    g.renderButton(holder, { type: "standard", theme: "filled_blue", size: "large", text: "continue_with", shape: "pill", logo_alignment: "left", width: Math.min(320, (holder.clientWidth || 300)) });
    if (fallback) fallback.style.display = "none";
  }

  // account now lives only in the ☰ menu; clear any old line under the player
  function paintBadge() {
    document.querySelectorAll(".ca-who").forEach(function (el) { el.remove(); });
  }

  /* ---------- play tracking ---------- */
  function storyId() { var m = location.hash.match(/^#\/s\/([^/?]+)/); return m ? decodeURIComponent(m[1]) : ""; }
  function track(v) {
    if (v.__ca) return; v.__ca = true;
    var doc = null, sid = storyId(), sent = {}, maxT = 0, lastSave = 0;
    function save(extra) {
      if (!user || !db) return;
      var d = v.duration || 0, pct = d ? Math.min(100, Math.round(maxT * 100 / d)) : 0;
      var data = { maxSec: Math.round(maxT), pct: pct, dur: Math.round(d), updated: firebase.firestore.FieldValue.serverTimestamp() };
      for (var k in extra) data[k] = extra[k];
      if (!doc) {
        if (v.__startAt) { maxT = Math.max(maxT, v.__startAt); v.__startAt = 0; }
        doc = db.collection("plays").doc();
        data.uid = user.uid; data.email = user.email || ""; data.story = v.getAttribute("data-story") || sid; data.lang = hi() ? "hi" : "en";
        data.mode = v.tagName === "AUDIO" ? "listen" : "watch";
        if (v.__contOf) { data.cont = true; data.of = v.__contOf; v.__contOf = null; }
        v.__caDoc = doc.id;
        data.started = firebase.firestore.FieldValue.serverTimestamp();
        doc.set(data).catch(function () {});
      } else doc.update(data).catch(function () {});
      lastSave = Date.now();
    }
    v.addEventListener("play", function () {
      if (user) { if (!doc) save({}); return; }
      init();   // no sign-in needed to play; the record starts once the silent sign-in is ready
    });
    v.addEventListener("timeupdate", function () {
      if (!user || v.seeking) return;
      if (v.currentTime > maxT && v.currentTime - maxT < 5) maxT = v.currentTime; // count real listening, not skipping ahead
      var d = v.duration || 0, ex = {};
      if (maxT >= 120 && !sent.m2) { sent.m2 = ex.m2 = true; }
      [25, 50, 75].forEach(function (q) { if (d && maxT >= d * q / 100 && !sent["p" + q]) { sent["p" + q] = ex["p" + q] = true; } });
      if (Object.keys(ex).length || Date.now() - lastSave > 30000) save(ex);
    });
    // the listen-mode player reuses one audio element: close the old record when it switches story
    v.addEventListener("chamku:switch", function () { if (user && doc) save({}); doc = null; sent = {}; maxT = 0; });
    v.addEventListener("ended", function () { maxT = v.duration || maxT; save({ done: true }); });
    v.addEventListener("pause", function () { if (user && doc) save({}); });
    window.addEventListener("pagehide", function () { if (user && doc) save({}); });
  }
  function scan() {
    document.querySelectorAll("video.player").forEach(track);
    if (user) paintBadge();
    if (/^#\/report/.test(location.hash)) report();
  }
  new MutationObserver(function (list) {
    // ignore changes we made ourselves (the signed-in line, the sign-in sheet)
    var ours = list.every(function (m) {
      return [].concat([].slice.call(m.addedNodes), [].slice.call(m.removedNodes)).every(function (n) {
        return n.nodeType === 1 && (n.classList.contains("ca-who") || n.classList.contains("ca-wrap"));
      });
    });
    if (ours) return;
    clearTimeout(scan.t); scan.t = setTimeout(scan, 80);
  }).observe(document.getElementById("app") || document.body, { childList: true, subtree: true });

  /* ---------- #/report (admins only) ---------- */
  function report() {
    var root = document.getElementById("ca-report"); if (!root || root.__done) return; root.__done = true;
    init().then(function (ok) {
      if (!ok) { root.textContent = "Login is not set up yet."; return; }
      if (!real()) { root.innerHTML = '<button class="pill" id="ca-rs">Sign in</button>'; root.querySelector("#ca-rs").onclick = openSheet; waiting = [function () { root.__done = false; report(); }]; return; }
      if (ADMINS.indexOf((user.email || "").toLowerCase()) < 0) { root.textContent = "This page is only for the Chamku team."; return; }
      root.textContent = "Loading…";
      Promise.all([db.collection("plays").orderBy("started", "desc").limit(5000).get(), db.collection("users").get(),
        fetch("data.json").then(function (x) { return x.json(); }).catch(function () { return { stories: [] }; })]).then(function (r) {
        var rows = {}, users = 0, anon = 0, byId = {}, conts = [];
        r[1].forEach(function (d) { if ((d.data().provider || "") === "anonymous") anon++; else users++; });
        r[0].forEach(function (d) { var p = d.data(); if (p.cont) conts.push(p); else byId[d.id] = p; });
        // a story that carried on as sound after the phone was locked: add its progress to the original play
        conts.forEach(function (c) { var o = byId[c.of]; if (!o) return; ["m2", "p25", "p50", "p75", "done"].forEach(function (k) { if (c[k]) o[k] = true; }); o.maxSec = Math.max(o.maxSec || 0, c.maxSec || 0); });
        Object.keys(byId).forEach(function (id) {
          var p = byId[id], s = rows[p.story] || (rows[p.story] = { plays: 0, people: {}, m2: 0, p50: 0, done: 0, early: 0 });
          s.plays++; s.people[p.uid] = 1; if (p.m2) s.m2++; if (p.p50) s.p50++; if (p.done) s.done++;
          if (!p.m2 && (p.maxSec || 0) < 120 && !p.done) s.early++;
        });
        var titles = {}; try { r[2].stories.forEach(function (x) { titles[x.id] = x.title.en; }); } catch (e) {}
        var list = Object.keys(rows).map(function (k) { var s = rows[k]; s.id = k; s.early_pct = Math.round(100 * s.early / s.plays); return s; })
          .sort(function (a, b) { return b.early_pct - a.early_pct; });
        function pc(a, b) { return b ? Math.round(100 * a / b) + "%" : "–"; }
        root.innerHTML = "<p><b>" + users + "</b> parents signed in · <b>" + anon + "</b> phones listening without signing in · <b>" + Object.keys(byId).length + "</b> plays</p>" +
          '<p class="small muted">Sorted by early stops. "Stopped early" = stopped before 2 minutes. Not finishing is fine at bedtime (the child may fall asleep); stopping early is the warning sign.</p>' +
          '<div style="overflow-x:auto"><table class="ca-table"><tr><th>Story</th><th>Plays</th><th>People</th><th>Stopped early</th><th>Past 2 min</th><th>Half</th><th>Finished</th></tr>' +
          list.map(function (s) {
            return "<tr><td>" + (titles[s.id] || s.id) + "</td><td>" + s.plays + "</td><td>" + Object.keys(s.people).length + "</td><td><b>" + s.early_pct + "%</b></td><td>" +
              pc(s.m2, s.plays) + "</td><td>" + pc(s.p50, s.plays) + "</td><td>" + pc(s.done, s.plays) + "</td></tr>";
          }).join("") + "</table></div>";
      }).catch(function (e) { root.textContent = "Could not load: " + (e && e.message); });
    });
  }

  /* ---------- hamburger menu: account + categories + links ---------- */
  var drawer = null;
  function closeMenu() { if (drawer) { drawer.remove(); drawer = null; } }
  function openMenu(D, lang) {
    closeMenu();
    var hiL = lang === "hi";
    function L(o) { return o ? (o[lang] || o.en || "") : ""; }
    function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    var acct = real()
      ? '<div class="cm-acct"><span>👤 ' + esc(user.email || user.displayName || "") + '</span><button class="link" id="cm-out" type="button">' + (hiL ? "Sign out" : "Sign out") + "</button></div>"
      : '<button class="pill wide" id="cm-in" type="button">' + (hiL ? "Sign in करें" : "Sign in") + "</button>";
    function kidText() {
      var k = null; try { k = JSON.parse(localStorage.getItem("glo.child") || "null"); } catch (e) {}
      var hasAge = k && k.age !== null && k.age !== undefined && k.age !== "";
      if (!k || (!k.name && !hasAge)) return hiL ? "बच्चे का नाम और उम्र" : "Child's name & age";
      var age = hasAge ? (k.age === 0 ? (hiL ? "1 साल से कम" : "under 1") : k.age + (hiL ? " साल" : (k.age === 1 ? " year" : " years"))) : "";
      return esc([k.name, age].filter(Boolean).join(" · ")) + ' <small class="cm-edit">' + (hiL ? "बदलें" : "change") + "</small>";
    }
    var cats = (D && D.categories || []).map(function (c) {
      return '<a class="cm-item" href="#/c/' + c.id + '"><span>' + c.icon + "</span>" + esc(L(c.name)) + "</a>";
    }).join("");
    var links = [["#/home", "🏠", hiL ? "Home" : "Home"], ["#/search", "🔍", hiL ? "Search" : "Search"], ["#/favs", "♥", hiL ? "मेरी पसंद" : "Favourites"],
      ["#/ask", "💬", hiL ? "चमकू से पूछें" : "Ask Chamku"], ["#/parents", "🔬", hiL ? "माता-पिता" : "Parents"]].map(function (x) {
      return '<a class="cm-item" href="' + x[0] + '"><span>' + x[1] + "</span>" + x[2] + "</a>";
    }).join("");
    var admin = user && ADMINS.indexOf((user.email || "").toLowerCase()) >= 0 ? '<a class="cm-item" href="#/report"><span>📊</span>Story report</a>' : "";
    drawer = document.createElement("div");
    drawer.className = "cm-wrap";
    drawer.innerHTML = '<aside class="cm-panel" role="dialog" aria-modal="true"><div class="cm-head"><b>Chamku</b><button class="icon-btn" id="cm-x" aria-label="Close">✕</button></div>' +
      acct + '<h4>' + (hiL ? "Categories" : "Categories") + "</h4>" + cats + "<h4>" + (hiL ? "और" : "More") + "</h4>" + links + admin +
      "<h4>" + (hiL ? "भाषा" : "Language") + '</h4><div class="cm-langs">' + (D.languages || []).filter(function (l) { return l.ready; }).map(function (l) {
        return '<button type="button" data-l="' + l.code + '" class="' + (l.code === lang ? "on" : "") + '">' + l.label + "</button>"; }).join("") + "</div>" +
      '<button class="cm-item" id="cm-set" type="button"><span>🧒</span>' + kidText() + "</button>" +
      '<a class="cm-item" href="privacy.html"><span>🔒</span>Privacy</a></aside>';
    document.body.appendChild(drawer);
    drawer.addEventListener("click", function (e) { if (e.target === drawer || e.target.closest("a.cm-item")) closeMenu(); });
    drawer.querySelector("#cm-x").onclick = closeMenu;
    [].forEach.call(drawer.querySelectorAll(".cm-langs button"), function (b) {
      b.onclick = function () { closeMenu(); if (window.chamkuSetLang) window.chamkuSetLang(b.getAttribute("data-l")); };
    });
    drawer.querySelector("#cm-set").onclick = function () { closeMenu(); if (window.chamkuOpenSettings) window.chamkuOpenSettings(); };
    var bi = drawer.querySelector("#cm-in");
    if (bi) bi.onclick = function () { closeMenu(); init().then(function (ok) { if (ok) { waiting = []; openSheet(); } }); };
    var bo = drawer.querySelector("#cm-out");
    if (bo) bo.onclick = function () { try { google.accounts.id.disableAutoSelect(); } catch (x) {} auth.signOut(); closeMenu(); };
  }
  window.ChamkuMenu = { open: openMenu, close: closeMenu };

  window.ChamkuAuth = { init: init, open: openSheet, user: function () { return user; }, track: track };
  init();
})();
