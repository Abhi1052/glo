/* Chamku "one tap plays".
   1. Tapping a story anywhere in the app opens it and starts it straight away (video in Watch mode, sound in Listen mode).
   2. Before a video has started, a big picture with a play button covers the black video box, so a tap anywhere on it starts the story.
   3. Tapping the Chamku name while already on the home page goes back to the top (so the tap is not ignored). */
(function () {
  var want = null;   // the story the parent just tapped: { id, t }

  function hi() { try { return JSON.parse(localStorage.getItem("glo.lang") || '"en"') === "hi"; } catch (e) { return false; } }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hashId() { var m = location.hash.match(/^#\/s\/([^/?]+)/); return m ? decodeURIComponent(m[1]) : ""; }
  function audio() { return document.getElementById("chamku-audio"); }

  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var a = e.target.closest('a[href^="#/s/"]');
    if (a) { var m = a.getAttribute("href").match(/^#\/s\/([^/?]+)/); if (m) want = { id: decodeURIComponent(m[1]), t: Date.now() }; }
    if (e.target.closest("a.brand") && /^(#\/home)?$/.test(location.hash.replace(/^#$/, ""))) window.scrollTo({ top: 0, behavior: "smooth" });
  }, true);

  function tryPlay(m) { var p; try { p = m.play(); } catch (e) {} if (p && p.catch) p.catch(function () {}); }

  function cover(v, id) {
    var info = window.chamkuInfo && window.chamkuInfo(id);
    var w = document.createElement("div"); w.className = "op-wrap";
    v.parentNode.insertBefore(w, v); w.appendChild(v);
    if (!v.paused || v.currentTime > 0) return;
    var c = document.createElement("button"); c.type = "button"; c.className = "op-cover";
    c.setAttribute("aria-label", hi() ? "कहानी शुरू करें" : "Play the story");
    c.innerHTML = '<span class="op-ic">' + esc(info ? info.icon : "🌙") + '</span><span class="op-btn">▶</span><span class="op-tx">' +
      esc(hi() ? "कहानी शुरू करने के लिए tap करें" : "Tap to play the story") + "</span>";
    w.appendChild(c);
    c.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); tryPlay(v); });
    var tx = c.querySelector(".op-tx"), label = tx.textContent;
    function gone() { if (c.parentNode) c.remove(); }
    function waiting() { c.classList.add("wait"); tx.textContent = hi() ? "शुरू हो रही है…" : "Starting…"; }
    function back() { c.classList.remove("wait"); tx.textContent = label; }
    v.addEventListener("play", waiting);          // pressed play: show that it is starting
    v.addEventListener("playing", gone);          // really playing: remove the cover
    v.addEventListener("timeupdate", function () { if (v.currentTime > 0) gone(); });
    v.addEventListener("pause", back); v.addEventListener("error", back);
  }

  function scan() {
    var page = document.querySelector(".story-page"); if (!page) return;
    var id = hashId(), v = page.querySelector("video.player");
    if (v && !v.__op) { v.__op = true; cover(v, id); }
    if (want && want.id === id && Date.now() - want.t < 5000) {
      want = null;
      if (v) tryPlay(v);
      else if (page.querySelector(".listen") && window.ChamkuPlayer && window.ChamkuPlayer.load(id)) { tryPlay(window.ChamkuPlayer.audio); }
    }
  }

  // Only one thing plays at a time: starting a video stops the Listen-mode sound.
  document.addEventListener("play", function (e) {
    var m = e.target; if (!m || m.tagName !== "VIDEO") return;
    var a = audio(); if (a && !a.paused) a.pause();
  }, true);

  var app = document.getElementById("app");
  if (app) new MutationObserver(scan).observe(app, { childList: true, subtree: true });
  window.addEventListener("hashchange", function () { setTimeout(scan, 0); });
  setTimeout(scan, 400);

  var css = document.createElement("style");
  css.textContent =
    ".op-wrap{position:relative;margin:8px 0}.op-wrap .player{margin:0}" +
    ".op-cover{position:absolute;inset:0;width:100%;border:0;border-radius:16px;cursor:pointer;color:#f4ecdc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;" +
    "background:linear-gradient(rgba(11,16,38,.55),rgba(11,16,38,.82)),url(glo-hero.webp) center/cover no-repeat #0f1532;font:inherit}" +
    ".op-ic{font-size:30px;line-height:1}" +
    ".op-btn{width:74px;height:74px;border-radius:50%;background:var(--amber,#f4b95a);color:#2a1a00;font-size:32px;display:grid;place-items:center;padding-left:6px;box-shadow:0 0 0 10px rgba(244,185,90,.18),0 8px 24px rgba(0,0,0,.45)}" +
    ".op-tx{font-weight:700;font-size:15px;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    ".op-cover.wait .op-btn{animation:op-pulse 1s ease-in-out infinite}@keyframes op-pulse{50%{transform:scale(.9);opacity:.7}}";
  document.head.appendChild(css);
})();
