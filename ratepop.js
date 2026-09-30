/* Chamku "How did your child like it?" card.
   Pops up when a story ends, or when it is paused after 40% of it has played.
   Asked once per story per phone (again after 3 days if the parent taps "Not now"); never after a rating was sent. */
(function () {
  var KEY_R = "glo.rated", KEY_A = "glo.asked", WAIT_DAYS = 3;
  var open = null, pauseTimer = null;

  function get(k) { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } }
  function put(k, id) { try { var o = get(k); o[id] = Date.now(); localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  function T(k) { return window.chamkuT ? window.chamkuT(k) : k; }
  function hi() { try { return JSON.parse(localStorage.getItem("glo.lang") || '"en"') === "hi"; } catch (e) { return false; } }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function idOf(m) { var h = location.hash.match(/^#\/s\/([^/?]+)/); return m.getAttribute("data-story") || (h ? decodeURIComponent(h[1]) : ""); }

  function allowed(id) {
    if (!id || open) return false;
    if (get(KEY_R)[id]) return false;
    var a = get(KEY_A)[id];
    return !(a && Date.now() - a < WAIT_DAYS * 864e5);
  }

  // A rating sent from the box under the story also counts, so the card never asks again.
  function wrapSender() {
    var f = window.chamkuSendFeedback;
    if (!f || f.__rp) return;
    var w = function (rec, cb) {
      var m = String(rec && rec.story || "").match(/\[([^\]]+)\]\s*$/);
      return f(rec, function (ok) { if (m) put(KEY_R, m[1]); if (cb) cb(ok); });
    };
    w.__rp = true; window.chamkuSendFeedback = w;
  }

  function scale(k, lo, hiKey) {
    var h = '<div class="rp-scale">';
    for (var n = 1; n <= 10; n++) h += '<button type="button" data-k="' + k + '" data-v="' + n + '">' + n + "</button>";
    return h + '</div><div class="rp-ends"><span>' + esc(T(lo)) + "</span><span>" + esc(T(hiKey)) + "</span></div>";
  }

  function show(id) {
    if (!allowed(id)) return;
    wrapSender();
    var info = window.chamkuInfo && window.chamkuInfo(id);
    if (!info || !window.chamkuSendFeedback) return;
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); } catch (e) {}
    try { var v = document.querySelector("video.player"); if (v && v.webkitDisplayingFullscreen && v.webkitExitFullscreen) v.webkitExitFullscreen(); } catch (e) {}

    var el = document.createElement("div");
    el.className = "rp-wrap";
    el.innerHTML = '<div class="rp-card" role="dialog" aria-modal="true" aria-label="' + esc(T("fbTitle")) + '">' +
      '<button type="button" class="rp-x" data-rp="later" aria-label="Close">✕</button>' +
      '<div class="rp-head"><span class="rp-icon">' + esc(info.icon) + '</span><div><b>' +
      esc(hi() ? "बच्चे को कहानी कैसी लगी?" : "How did your child like it?") + '</b><div class="rp-title">' + esc(info.title) + "</div></div></div>" +
      '<p class="rp-q">' + esc(T("fbGot")) + "</p>" + scale("got", "fbGotLo", "fbGotHi") +
      '<p class="rp-q">' + esc(T("fbInt")) + "</p>" + scale("int", "fbIntLo", "fbIntHi") +
      '<p class="rp-msg"></p>' +
      '<button type="button" class="rp-send" data-rp="send">' + esc(T("fbSend")) + "</button>" +
      '<button type="button" class="rp-later" data-rp="later">' + esc(hi() ? "अभी नहीं" : "Not now") + "</button></div>";
    document.body.appendChild(el);
    open = { el: el, id: id, info: info };
    requestAnimationFrame(function () { el.classList.add("on"); });

    el.addEventListener("click", function (e) {
      if (e.target === el) { close(true); return; }
      var b = e.target.closest("button"); if (!b) return;
      var k = b.getAttribute("data-k");
      if (k) {
        el.querySelectorAll('[data-k="' + k + '"]').forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); return;
      }
      var act = b.getAttribute("data-rp");
      if (act === "later") { close(true); return; }
      if (act === "send") {
        var gt = el.querySelector('.on[data-k="got"]'), it = el.querySelector('.on[data-k="int"]');
        var msg = el.querySelector(".rp-msg");
        if (!gt || !it) { msg.textContent = T("fbPick"); return; }
        b.disabled = true;
        var s = info.titleEn || info.title;
        window.chamkuSendFeedback({ story: s + " [" + id + "]", got: gt.getAttribute("data-v"), int: it.getAttribute("data-v"),
          lang: (function () { try { return JSON.parse(localStorage.getItem("glo.lang") || '"en"'); } catch (x) { return "en"; } })(), src: "popup" },
          function (ok) {
            put(KEY_R, id);
            msg.textContent = T(ok ? "fbThanks" : "fbFail");
            b.textContent = "✅ " + T("fbDone");
            setTimeout(function () { close(false); }, 1800);
          });
      }
    });
  }

  function close(later) {
    if (!open) return;
    if (later) put(KEY_A, open.id);
    var el = open.el; open = null;
    el.classList.remove("on");
    setTimeout(function () { el.remove(); }, 250);
  }

  // Watch every video and the listen-mode sound.
  document.addEventListener("ended", function (e) {
    var m = e.target; if (!m || !/^(VIDEO|AUDIO)$/.test(m.tagName)) return;
    clearTimeout(pauseTimer);
    var id = idOf(m); setTimeout(function () { show(id); }, 600);
  }, true);
  document.addEventListener("pause", function (e) {
    var m = e.target; if (!m || !/^(VIDEO|AUDIO)$/.test(m.tagName) || m.ended || !m.duration) return;
    if (m.currentTime < m.duration * 0.4 || m.currentTime < 60) return;
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(function () {
      if (!m.paused || m.ended || document.visibilityState !== "visible") return;   // playing again, or phone locked
      if (!document.contains(m)) return;   // the page changed (for example, switched to listen mode)
      if ([].some.call(document.querySelectorAll("video,audio"), function (x) { return !x.paused; })) return;   // something is still playing
      show(idOf(m));
    }, 2500);
  }, true);
  document.addEventListener("play", function () { clearTimeout(pauseTimer); }, true);
  document.addEventListener("visibilitychange", function () {
    // Paused from the lock screen after 40%: ask when the parent comes back to the app.
    if (document.visibilityState !== "visible") return;
    var a = document.getElementById("chamku-audio");
    if (a && a.paused && !a.ended && a.duration && a.currentTime >= Math.max(60, a.duration * 0.4)) show(a.getAttribute("data-story") || "");
  });
  window.addEventListener("hashchange", function () { if (open) close(true); });
  setTimeout(wrapSender, 1500);

  var css = document.createElement("style");
  css.textContent =
    ".rp-wrap{position:fixed;inset:0;z-index:80;background:rgba(5,8,20,.55);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s}" +
    ".rp-wrap.on{opacity:1}" +
    ".rp-card{position:relative;width:100%;max-width:560px;background:var(--card,#141b3d);color:var(--text,#f4ecdc);border:1px solid var(--line,rgba(255,255,255,.08));" +
    "border-radius:20px 20px 0 0;padding:18px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.45);transform:translateY(24px);transition:transform .25s}" +
    ".rp-wrap.on .rp-card{transform:none}" +
    ".rp-x{position:absolute;top:8px;right:10px;background:none;border:0;color:var(--muted,#b8b0a0);font-size:18px;padding:8px}" +
    ".rp-head{display:flex;gap:12px;align-items:center;margin:0 28px 6px 0}.rp-head b{font-size:18px}" +
    ".rp-icon{font-size:34px;line-height:1}.rp-title{color:var(--muted,#b8b0a0);font-size:14px}" +
    ".rp-q{margin:12px 0 6px;font-weight:600;font-size:15px}" +
    ".rp-scale{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}" +
    ".rp-scale button{padding:9px 0;border-radius:10px;border:1px solid var(--line,rgba(255,255,255,.08));background:#252c4f;color:var(--text,#f4ecdc);font-weight:700;min-width:0}" +
    ".rp-scale button.on{background:var(--amber,#f4b95a);color:#2a1a00}" +
    ".rp-ends{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--muted,#b8b0a0);margin-top:3px}" +
    ".rp-msg{min-height:1.2em;font-size:14px;color:var(--muted,#b8b0a0);margin:10px 0 0}" +
    ".rp-send{width:100%;margin-top:6px;padding:12px;border:0;border-radius:999px;background:var(--amber,#f4b95a);color:#2a1a00;font-weight:700;font-size:16px}" +
    ".rp-later{width:100%;margin-top:6px;padding:8px;border:0;background:none;color:var(--muted,#b8b0a0);font-size:14px}";
  document.head.appendChild(css);
})();
