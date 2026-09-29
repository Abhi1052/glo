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
  function init() {
    if (ready) return ready;
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
            user = u; ok(true); paintBadge();
            if (u) {
              db.collection("users").doc(u.uid).set({ email: u.email || "", name: u.displayName || "", provider: (u.providerData[0] || {}).providerId || "email",
                lastSeen: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(function () {});
              var w = waiting; waiting = []; w.forEach(function (f) { f(); });
              closeSheet();
            }
          });
        });
      }).catch(function () { return false; });
    return ready;
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
      '<button class="pill wide ca-google" id="ca-g"><span class="ca-gl">G</span> ' + T("Continue with Google", "Google से आगे बढ़ें") + "</button>" +
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

  // signed-in line under the story player
  function paintBadge() {
    document.querySelectorAll(".ca-who").forEach(function (el) { el.remove(); });
    if (!user) return;
    document.querySelectorAll("video.player").forEach(function (v) {
      var p = document.createElement("p"); p.className = "ca-who small muted";
      p.innerHTML = "👤 " + (user.email || user.displayName || "") + ' · <button class="link" type="button">' + T("Sign out", "Sign out") + "</button>";
      p.querySelector("button").onclick = function () { auth.signOut(); };
      v.insertAdjacentElement("afterend", p);
    });
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
        doc = db.collection("plays").doc();
        data.uid = user.uid; data.email = user.email || ""; data.story = sid; data.lang = hi() ? "hi" : "en";
        data.started = firebase.firestore.FieldValue.serverTimestamp();
        doc.set(data).catch(function () {});
      } else doc.update(data).catch(function () {});
      lastSave = Date.now();
    }
    v.addEventListener("play", function () {
      if (!auth) return; // login not set up yet: let it play
      if (!user) { v.pause(); waiting = [function () { v.play(); }]; openSheet(); return; }
      if (!doc) save({});
    });
    v.addEventListener("timeupdate", function () {
      if (!user || v.seeking) return;
      if (v.currentTime > maxT && v.currentTime - maxT < 5) maxT = v.currentTime; // count real listening, not skipping ahead
      var d = v.duration || 0, ex = {};
      if (maxT >= 120 && !sent.m2) { sent.m2 = ex.m2 = true; }
      [25, 50, 75].forEach(function (q) { if (d && maxT >= d * q / 100 && !sent["p" + q]) { sent["p" + q] = ex["p" + q] = true; } });
      if (Object.keys(ex).length || Date.now() - lastSave > 30000) save(ex);
    });
    v.addEventListener("ended", function () { maxT = v.duration || maxT; save({ done: true }); });
    v.addEventListener("pause", function () { if (user && doc) save({}); });
    window.addEventListener("pagehide", function () { if (user && doc) save({}); });
  }
  function scan() {
    document.querySelectorAll("video.player").forEach(track);
    if (user) paintBadge();
    if (/^#\/report/.test(location.hash)) report();
  }
  new MutationObserver(function () { clearTimeout(scan.t); scan.t = setTimeout(scan, 50); }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- #/report (admins only) ---------- */
  function report() {
    var root = document.getElementById("ca-report"); if (!root || root.__done) return; root.__done = true;
    init().then(function (ok) {
      if (!ok) { root.textContent = "Login is not set up yet."; return; }
      if (!user) { root.innerHTML = '<button class="pill" id="ca-rs">Sign in</button>'; root.querySelector("#ca-rs").onclick = openSheet; waiting = [function () { root.__done = false; report(); }]; return; }
      if (ADMINS.indexOf((user.email || "").toLowerCase()) < 0) { root.textContent = "This page is only for the Chamku team."; return; }
      root.textContent = "Loading…";
      Promise.all([db.collection("plays").orderBy("started", "desc").limit(5000).get(), db.collection("users").get(),
        fetch("data.json").then(function (x) { return x.json(); }).catch(function () { return { stories: [] }; })]).then(function (r) {
        var rows = {}, users = r[1].size;
        r[0].forEach(function (d) {
          var p = d.data(), s = rows[p.story] || (rows[p.story] = { plays: 0, people: {}, m2: 0, p50: 0, done: 0, early: 0 });
          s.plays++; s.people[p.uid] = 1; if (p.m2) s.m2++; if (p.p50) s.p50++; if (p.done) s.done++;
          if (!p.m2 && (p.maxSec || 0) < 120 && !p.done) s.early++;
        });
        var titles = {}; try { r[2].stories.forEach(function (x) { titles[x.id] = x.title.en; }); } catch (e) {}
        var list = Object.keys(rows).map(function (k) { var s = rows[k]; s.id = k; s.early_pct = Math.round(100 * s.early / s.plays); return s; })
          .sort(function (a, b) { return b.early_pct - a.early_pct; });
        function pc(a, b) { return b ? Math.round(100 * a / b) + "%" : "–"; }
        root.innerHTML = "<p><b>" + users + "</b> parents signed up · <b>" + r[0].size + "</b> plays</p>" +
          '<p class="small muted">Sorted by early stops. "Stopped early" = stopped before 2 minutes. Not finishing is fine at bedtime (the child may fall asleep); stopping early is the warning sign.</p>' +
          '<div style="overflow-x:auto"><table class="ca-table"><tr><th>Story</th><th>Plays</th><th>People</th><th>Stopped early</th><th>Past 2 min</th><th>Half</th><th>Finished</th></tr>' +
          list.map(function (s) {
            return "<tr><td>" + (titles[s.id] || s.id) + "</td><td>" + s.plays + "</td><td>" + Object.keys(s.people).length + "</td><td><b>" + s.early_pct + "%</b></td><td>" +
              pc(s.m2, s.plays) + "</td><td>" + pc(s.p50, s.plays) + "</td><td>" + pc(s.done, s.plays) + "</td></tr>";
          }).join("") + "</table></div>";
      }).catch(function (e) { root.textContent = "Could not load: " + (e && e.message); });
    });
  }

  window.ChamkuAuth = { init: init, open: openSheet, user: function () { return user; } };
  init();
})();
