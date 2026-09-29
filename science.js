/* Chamku science: "The science behind this story" on every story page, and the Science library page (#/science).
   Data: science.json (sources + one research note per story). Loaded only when needed. */
(function () {
  var data = null, loading = null;
  function get() {
    if (data) return Promise.resolve(data);
    if (!loading) loading = fetch("science.json").then(function (r) { return r.json(); }).then(function (d) { data = d; return d; }).catch(function () { loading = null; return null; });
    return loading;
  }
  function hi() { try { return JSON.parse(localStorage.getItem("glo.lang") || '"en"') === "hi"; } catch (e) { return false; } }
  function T(en, h) { return hi() ? h : en; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function storyId() { var m = location.hash.match(/^#\/s\/([^/?]+)/); return m ? decodeURIComponent(m[1]) : ""; }
  function baseId(id) { return id.replace(/-(bn|mr|ta|te|kn|ml)$/, ""); }   // a story in another language uses the same science

  function cite(line) {
    var s = line.authors ? esc(line.authors) + " (" + esc(line.year || "n.d.") + "). " : "";
    return s + "<i>" + esc(line.title) + "</i>. " + esc(line.journal || "") + (line.type ? ' <span class="sci-type">' + esc(line.type) + (line.n ? " · " + esc(line.n) : "") + "</span>" : "") +
      (line.url ? ' <a href="' + esc(line.url) + '" target="_blank" rel="noopener">' + T("Read", "पढ़ें") + " ↗</a>" : "");
  }

  function block(d, id) {
    var v = d.stories[id]; if (!v) return "";
    var order = [], num = {};
    function refs(keys) {
      return (keys || []).filter(function (k) { return d.sources[k]; }).map(function (k) {
        if (!num[k]) { order.push(k); num[k] = order.length; }
        return '<a class="sci-ref" href="#sci-' + id + "-" + num[k] + '" data-sci="' + num[k] + '">' + num[k] + "</a>";
      }).join("");
    }
    var findings = v.findings.map(function (f) { return "<li>" + esc(f.text) + " " + refs(f.src) + "</li>"; }).join("");
    var h = '<section class="sci-box" data-id="' + id + '">' +
      '<div class="sci-head"><span class="sci-badge">🔬 ' + T("The science behind this story", "इस कहानी के पीछे का विज्ञान") + "</span>" +
      '<span class="sci-skill">' + esc(v.skill) + "</span></div>" +
      '<p class="sci-headline">' + esc(v.headline) + "</p>" +
      "<h4>" + T("What research shows", "रिसर्च क्या कहती है") + '</h4><ol class="sci-list">' + findings + "</ol>" +
      "<h4>" + T("How Chamku uses it in this story", "चमकू इस कहानी में इसे कैसे इस्तेमाल करता है") + "</h4><p>" + esc(v.how_story_uses_it) + "</p>" +
      (v.age_note ? '<div class="sci-card"><b>📏 ' + T("What is typical at this age", "इस उम्र में क्या आम है") + "</b><p>" + esc(v.age_note) + " " + refs(v.age_src) + "</p></div>" : "") +
      (v.try_tonight ? '<div class="sci-card sci-try"><b>🌙 ' + T("Try this tonight", "आज रात ये करके देखें") + "</b><p>" + esc(v.try_tonight) + " " + refs(v.try_src) + "</p></div>" : "");
    h += '<details class="sci-src"><summary>📚 ' + T("Sources", "स्रोत") + " (" + order.length + ")</summary><ol>" +
      order.map(function (k, i) { return '<li id="sci-' + id + "-" + (i + 1) + '">' + cite(d.sources[k]) + "</li>"; }).join("") + "</ol></details>" +
      '<p class="sci-note small muted">' + T("Written by the Chamku team from published research.", "चमकू टीम ने छपी हुई रिसर्च से लिखा है।") +
      ' <a href="#/science">' + T("See all the science", "पूरा विज्ञान देखें") + " →</a></p></section>";
    return h;
  }

  function library(d) {
    var ids = Object.keys(d.stories), src = d.sources, keys = Object.keys(src);
    var used = {}; ids.forEach(function (id) {
      var v = d.stories[id];
      [].concat.apply([], v.findings.map(function (f) { return f.src; })).concat(v.age_src || [], v.try_src || []).forEach(function (k) { (used[k] = used[k] || {})[id] = 1; });
    });
    var findings = ids.reduce(function (n, id) { return n + d.stories[id].findings.length; }, 0);
    var titles = window.chamkuInfo ? function (id) { var i = window.chamkuInfo(id); return i ? i.icon + " " + i.title : id; } : function (id) { return id; };
    var skills = ids.map(function (id) {
      var v = d.stories[id];
      return '<a class="lib-story" href="#/s/' + id + '"><b>' + esc(titles(id)) + "</b><span>" + esc(v.skill) + "</span><i>" + esc(v.headline) + "</i></a>";
    }).join("");
    var list = keys.filter(function (k) { return used[k]; }).sort(function (a, b) { return (src[b].year || 0) - (src[a].year || 0); }).map(function (k) {
      return "<li>" + cite(src[k]) + ' <span class="sci-used">' + T("Used in", "इसमें") + " " + Object.keys(used[k]).length + " " + T("stories", "कहानियाँ") + "</span></li>";
    }).join("");
    return '<p class="sci-intro">' + T("Every Chamku story is built on research about how young children grow: sleep, feelings, habits, friendship, thinking and language. Here is all of it in one place.",
        "चमकू की हर कहानी बच्चों के विकास पर हुई रिसर्च पर बनी है — नींद, भावनाएँ, आदतें, दोस्ती, सोचना और भाषा। सब कुछ यहाँ एक जगह।") + "</p>" +
      '<div class="lib-stats"><div><b>' + Object.keys(used).length + "</b><span>" + T("studies & guidelines", "रिसर्च और गाइडलाइन") + "</span></div><div><b>" + findings + "</b><span>" + T("research findings", "रिसर्च के नतीजे") + "</span></div><div><b>" + ids.length + "</b><span>" + T("stories explained", "कहानियाँ समझाई गईं") + "</span></div></div>" +
      "<h2 class=\"row-title\">" + T("The science of each story", "हर कहानी का विज्ञान") + '</h2><div class="lib-stories">' + skills + "</div>" +
      "<h2 class=\"row-title\">" + T("All sources", "सभी स्रोत") + '</h2><ol class="lib-src">' + list + "</ol>" +
      '<p class="sci-note small muted">' + T("Written by the Chamku team from published research.", "चमकू टीम ने छपी हुई रिसर्च से लिखा है।") + "</p>";
  }

  function scan() {
    var id = storyId(), page = document.querySelector(".story-page");
    if (id && page && !page.querySelector(".sci-box")) {
      get().then(function (d) {
        if (!d || !d.stories[baseId(id)] || page.querySelector(".sci-box") || storyId() !== id) return;
        var html = block(d, baseId(id)); if (!html) return;
        var anchor = page.querySelector(".fbbox") || page.querySelector(".talk");
        var tmp = document.createElement("div"); tmp.innerHTML = html;
        if (anchor) anchor.insertAdjacentElement("afterend", tmp.firstChild); else page.appendChild(tmp.firstChild);
      });
    }
    var lib = document.getElementById("sci-lib");
    if (lib && !lib.__done) { lib.__done = true; get().then(function (d) { lib.innerHTML = d ? library(d) : "Could not load."; }); }
  }
  var app = document.getElementById("app");
  if (app) new MutationObserver(function () { clearTimeout(scan.t); scan.t = setTimeout(scan, 60); }).observe(app, { childList: true });
  window.addEventListener("hashchange", function () { setTimeout(scan, 120); });
  setTimeout(scan, 300);
  // tap a small number: open the sources list and jump to that source
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".sci-ref"); if (!a) return;
    e.preventDefault();
    var box = a.closest(".sci-box"), det = box && box.querySelector(".sci-src"), li = box && box.querySelector("#" + a.getAttribute("href").slice(1));
    if (det) det.open = true;
    if (li) { li.scrollIntoView({ behavior: "smooth", block: "center" }); li.classList.add("sci-flash"); setTimeout(function () { li.classList.remove("sci-flash"); }, 1600); }
  });
})();
