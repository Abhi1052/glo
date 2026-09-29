/* Ask Chamku — free, in-browser parenting Q&A.
   Answers come from Chamku's vetted library (parent_kb.json): every answer is written from
   AAP / CDC / WHO / UNICEF / Harvard / NHS / IAP guidance and carries links to the evidence.
   No server, no account, no cost. Voice input uses the phone's own speech recognition. */
(function () {
  "use strict";
  var KB = null, loading = null;
  var STOP = ("a an the is are am was were be been i me my mine we our you your he she it they them his her its of to in on at for with and or but " +
    "not no do does did doesnt dont don't what how why when where which who should can could would will shall about child children kid kids son daughter " +
    "baby toddler year years old age please help tell know want get make much many very really just also so this that these those there here " +
    "mera meri mere mujhe hum humara bachcha baccha bacha bachche bachchi beta beti kya kaise kyun kyu kab karu karun karoon karna kare kar nahi nhi na " +
    "hai hain tha thi ko ki ka ke se me mein par aur ya bhi toh to jo woh wo ye yeh apna apni apne " +
    "मेरा मेरी मेरे मुझे बच्चा बच्चे बच्ची बेटा बेटी क्या कैसे क्यों कब करूँ करूं करना करे कर नहीं ना है हैं था थी को की का के से में पर और या भी तो जो वो यह ये अपना अपनी अपने").split(/\s+/);
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });

  function norm(s) {
    return String(s || "").toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }
  function toks(s) { return norm(s).split(" ").filter(function (w) { return w && !STOPSET[w] && w.length > 1; }); }
  function stem(w) { return w.length > 5 ? w.replace(/(ing|ings|ed|es|s)$/, "") : w; }
  function near(a, b) { // edit distance <= 1
    if (a === b) return true;
    var la = a.length, lb = b.length; if (Math.abs(la - lb) > 1 || Math.min(la, lb) < 5) return false;
    var i = 0, j = 0, e = 0;
    while (i < la && j < lb) { if (a[i] === b[j]) { i++; j++; continue; } if (++e > 1) return false; if (la > lb) i++; else if (lb > la) j++; else { i++; j++; } }
    return e + (la - i) + (lb - j) <= 1;
  }
  function pre(w, k) { // prefix match, mainly for Hindi word endings (डर → डरता, डरती)
    var dev = /[\u0900-\u097F]/.test(w);
    var min = dev ? 2 : 4;
    return k.length >= min && w.length >= min && (w.indexOf(k) === 0 || (k.indexOf(w) === 0 && w.length >= min + 1));
  }
  function prep(kb) {
    kb.entries.forEach(function (e) {
      e._kw = (e.keywords || []).map(function (k) { var n = norm(k); return { phrase: n, words: n.split(" ").filter(Boolean) }; });
      e._t = {};
      toks(e.q_en + " " + e.q_hi + " " + e.short_en + " " + (e.keywords || []).join(" ")).forEach(function (w) { e._t[stem(w)] = 1; });
    });
    return kb;
  }
  function score(e, qn, qt) {
    var s = 0;
    e._kw.forEach(function (k) {
      if (!k.phrase) return;
      if (k.words.length > 1) { if ((" " + qn + " ").indexOf(" " + k.phrase + " ") >= 0) s += 3 + k.words.length; }
      else if (qt.some(function (w) { return w === k.phrase || stem(w) === stem(k.phrase) || near(w, k.phrase) || pre(w, k.phrase); })) s += 3;
    });
    qt.forEach(function (w) { if (e._t[stem(w)]) s += 1; });
    return s;
  }
  function search(q) {
    var qn = norm(q), qt = toks(q);
    if (!qt.length) return [];
    return KB.entries.map(function (e) { return { e: e, s: score(e, qn, qt) }; })
      .filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; });
  }
  function load() {
    if (KB) return Promise.resolve(KB);
    if (!loading) loading = fetch("parent_kb.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) { KB = prep(d); return KB; });
    return loading;
  }

  var T = {
    en: {
      title: "Ask Chamku", sub: "Chamku tells your child stories. With you, Chamku talks science: child psychology, brain development and good habits — with links to the evidence.",
      ph: "Type your question… e.g. My child won't share toys", send: "Ask", mic: "Speak", listening: "Listening… speak now",
      noMic: "Voice typing isn't available in this browser. Please type your question.", try: "Parents often ask",
      src: "Where this comes from", more: "Related answers", listen: "🔊 Listen", stop: "■ Stop", other: "हिंदी में पढ़ें",
      none: "I don't have a checked answer for that yet. Every answer I give comes from child-development experts, so I don't guess. Here are the closest topics I do know:",
      sendTeam: "Send this question to the Chamku team on WhatsApp", ages: "Ages",
      disc: "Chamku gives general, research-based parenting guidance, not medical advice. For health, growth or development worries, please talk to your paediatrician.",
      hello: "Hi! I'm Chamku. Ask me anything about your child's feelings, behaviour, manners, sleep, screens or learning. I'll answer from the research and show you where to read more.",
      topics: "Browse topics", cat: { values: "Values", manners: "Manners", emotions: "Feelings", behaviour: "Behaviour", sleep: "Sleep", screens: "Screens", food: "Food", brain: "Brain", language: "Language", learning: "Learning", play: "Play", social: "Friends", routines: "Routines", "big-moments": "Big moments", "health-basics": "Health basics" }
    },
    hi: {
      title: "चमकू से पूछिए", sub: "बच्चे को चमकू कहानी सुनाता है। आपसे चमकू science की बात करता है: child psychology, दिमाग़ का विकास और अच्छी आदतें — सबूत के links के साथ।",
      ph: "अपना सवाल लिखिए… जैसे: मेरा बच्चा toys share नहीं करता", send: "पूछें", mic: "बोलें", listening: "सुन रहा हूँ… अब बोलिए",
      noMic: "इस browser में बोलकर लिखने की सुविधा नहीं है। कृपया सवाल टाइप कीजिए।", try: "माता-पिता अक्सर पूछते हैं",
      src: "यह जानकारी कहाँ से है", more: "इससे जुड़े जवाब", listen: "🔊 सुनें", stop: "■ रोकें", other: "Read in English",
      none: "इसका जाँचा हुआ जवाब अभी मेरे पास नहीं है। मैं अंदाज़ा नहीं लगाता — मेरा हर जवाब child-development experts से आता है। ये मिलते-जुलते विषय देखिए:",
      sendTeam: "यह सवाल WhatsApp पर Chamku team को भेजें", ages: "उम्र",
      disc: "चमकू research पर आधारित आम parenting सलाह देता है, डॉक्टरी सलाह नहीं। सेहत, विकास या बढ़त की चिंता हो तो अपने बच्चों के डॉक्टर से बात कीजिए।",
      hello: "नमस्ते! मैं चमकू हूँ। बच्चे की भावनाएँ, व्यवहार, manners, नींद, screen या पढ़ाई — कुछ भी पूछिए। मैं research से जवाब दूँगा और बताऊँगा कि और कहाँ पढ़ें।",
      topics: "विषय देखें", cat: { values: "संस्कार", manners: "Manners", emotions: "भावनाएँ", behaviour: "व्यवहार", sleep: "नींद", screens: "Screen", food: "खाना", brain: "दिमाग़", language: "भाषा", learning: "सीखना", play: "खेल", social: "दोस्त", routines: "रूटीन", "big-moments": "बड़े पल", "health-basics": "सेहत" }
    }
  };
  var STARTERS = ["sharing-toys", "please-thank-you", "tantrums", "screen-time-by-age", "bedtime-routine", "picky-eating", "not-hitting", "losing-games"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function para(s) {
    return String(s || "").split(/\n+/).map(function (l) { l = l.trim(); if (!l) return ""; return /^\d+[.)]/.test(l) ? '<p class="ak-step">' + esc(l) + "</p>" : "<p>" + esc(l) + "</p>"; }).join("");
  }

  function mount(root, opts) {
    var lang = opts && opts.lang === "hi" ? "hi" : "en", t = T[lang];
    var ansLang = lang;
    root.innerHTML =
      '<div class="ak">' +
      '<div class="ak-head"><img src="glo-face.webp" alt="" class="ak-face"><div><h2>' + t.title + "</h2><p>" + t.sub + "</p></div></div>" +
      '<div class="ak-log" id="ak-log" aria-live="polite"><div class="ak-msg bot"><p>' + esc(t.hello) + "</p></div></div>" +
      '<div class="ak-starters" id="ak-starters"></div>' +
      '<form class="ak-form" id="ak-form"><input id="ak-q" autocomplete="off" enterkeyhint="send" placeholder="' + esc(t.ph) + '">' +
      '<button type="button" class="ak-mic" id="ak-mic" aria-label="' + esc(t.mic) + '">🎤</button><button class="ak-send" type="submit">' + t.send + "</button></form>" +
      '<p class="ak-hint" id="ak-hint"></p>' +
      '<details class="ak-browse"><summary>📚 ' + t.topics + '</summary><div id="ak-browse"></div></details>' +
      '<p class="ak-disc">⚕️ ' + t.disc + "</p></div>";
    var log = root.querySelector("#ak-log"), form = root.querySelector("#ak-form"), qi = root.querySelector("#ak-q"), hint = root.querySelector("#ak-hint");

    function user(q) { log.insertAdjacentHTML("beforeend", '<div class="ak-msg me"><p>' + esc(q) + "</p></div>"); }
    function scrollEnd() { var last = log.lastElementChild; if (last && last.scrollIntoView) last.scrollIntoView({ behavior: "smooth", block: "start" }); }
    function answerHTML(e, related) {
      var a = ansLang === "hi" && e.answer_hi ? e.answer_hi : e.answer_en;
      var q = ansLang === "hi" && e.q_hi ? e.q_hi : e.q_en;
      return '<div class="ak-msg bot" data-id="' + esc(e.id) + '"><div class="ak-q">' + esc(q) + ' <span class="ak-age">' + t.ages + " " + esc(e.ages) + "</span></div>" +
        '<p class="ak-short">' + esc(e.short_en && ansLang === "en" ? e.short_en : "") + "</p>" + para(a) +
        '<div class="ak-src"><b>📎 ' + t.src + "</b><ul>" + (e.sources || []).map(function (s) {
          return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + "</a> <span>— " + esc(s.org) + "</span></li>";
        }).join("") + "</ul></div>" +
        '<div class="ak-tools"><button type="button" class="chip" data-ak="say">' + t.listen + '</button><button type="button" class="chip" data-ak="flip">' + t.other + "</button></div>" +
        (related && related.length ? '<div class="ak-rel"><b>' + t.more + "</b>" + related.map(function (r) {
          return '<button type="button" class="chip" data-ak="open" data-id="' + esc(r.id) + '">' + esc(lang === "hi" && r.q_hi ? r.q_hi : r.q_en) + "</button>";
        }).join("") + "</div>" : "") + "</div>";
    }
    function show(e, related) { log.insertAdjacentHTML("beforeend", answerHTML(e, related)); scrollEnd(); }
    function ask(q) {
      q = String(q || "").trim(); if (!q) return;
      user(q); qi.value = "";
      load().then(function () {
        var r = search(q);
        if (r.length && r[0].s >= 3) show(r[0].e, r.slice(1, 4).filter(function (x) { return x.s >= 3; }).map(function (x) { return x.e; }));
        else {
          var near = r.slice(0, 4).map(function (x) { return x.e; });
          if (!near.length) near = STARTERS.map(byId).filter(Boolean).slice(0, 4);
          var msg = "Question for Chamku (parent app): " + q;
          log.insertAdjacentHTML("beforeend", '<div class="ak-msg bot"><p>' + esc(t.none) + '</p><div class="ak-rel">' + near.map(function (e) {
            return '<button type="button" class="chip" data-ak="open" data-id="' + esc(e.id) + '">' + esc(lang === "hi" && e.q_hi ? e.q_hi : e.q_en) + "</button>";
          }).join("") + '</div><p><a class="ak-wa" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">💬 ' + t.sendTeam + "</a></p></div>");
          scrollEnd();
        }
      });
    }
    function byId(id) { return KB && KB.entries.filter(function (e) { return e.id === id; })[0]; }

    load().then(function () {
      var st = STARTERS.map(byId).filter(Boolean);
      root.querySelector("#ak-starters").innerHTML = "<b>" + t.try + "</b>" + st.map(function (e) {
        return '<button type="button" class="chip" data-ak="open" data-id="' + esc(e.id) + '">' + esc(lang === "hi" && e.q_hi ? e.q_hi : e.q_en) + "</button>";
      }).join("");
      var cats = {}; KB.entries.forEach(function (e) { (cats[e.category] = cats[e.category] || []).push(e); });
      root.querySelector("#ak-browse").innerHTML = Object.keys(cats).map(function (c) {
        return "<h4>" + esc(t.cat[c] || c) + "</h4>" + cats[c].map(function (e) {
          return '<button type="button" class="ak-link" data-ak="open" data-id="' + esc(e.id) + '">' + esc(lang === "hi" && e.q_hi ? e.q_hi : e.q_en) + "</button>";
        }).join("");
      }).join("");
    }).catch(function () { hint.textContent = "Could not load Chamku's library. Please check your internet."; });

    form.addEventListener("submit", function (ev) { ev.preventDefault(); ask(qi.value); });
    root.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-ak]"); if (!b) return;
      var act = b.getAttribute("data-ak"), box = b.closest(".ak-msg"), id = b.getAttribute("data-id") || (box && box.getAttribute("data-id"));
      if (act === "open") { var e = byId(id); if (e) { user(lang === "hi" && e.q_hi ? e.q_hi : e.q_en); var r = search(e.q_en + " " + (e.keywords || []).slice(0, 5).join(" ")).filter(function (x) { return x.e.id !== e.id && x.s >= 4; }); show(e, r.slice(0, 3).map(function (x) { return x.e; })); var d = root.querySelector(".ak-browse"); if (d) d.open = false; } }
      else if (act === "flip") { ansLang = ansLang === "hi" ? "en" : "hi"; var e2 = byId(id); if (e2 && box) { box.outerHTML = answerHTML(e2, []); } }
      else if (act === "say") {
        if (!("speechSynthesis" in window)) return;
        if (speechSynthesis.speaking) { speechSynthesis.cancel(); b.textContent = t.listen; return; }
        var e3 = byId(id); if (!e3) return;
        var u = new SpeechSynthesisUtterance(ansLang === "hi" && e3.answer_hi ? e3.answer_hi : e3.answer_en);
        u.lang = ansLang === "hi" ? "hi-IN" : "en-IN"; u.rate = 0.95; u.onend = function () { b.textContent = t.listen; };
        speechSynthesis.speak(u); b.textContent = t.stop;
      }
    });
    var micBtn = root.querySelector("#ak-mic"), SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    micBtn.addEventListener("click", function () {
      if (!SR) { hint.textContent = t.noMic; return; }
      var rec = new SR(); rec.lang = lang === "hi" ? "hi-IN" : "en-IN"; rec.interimResults = true; rec.maxAlternatives = 1;
      var finalText = "";
      rec.onstart = function () { micBtn.classList.add("on"); hint.textContent = t.listening; };
      rec.onresult = function (ev) {
        var txt = ""; for (var i = 0; i < ev.results.length; i++) { txt += ev.results[i][0].transcript; if (ev.results[i].isFinal) finalText = txt; }
        qi.value = txt;
      };
      rec.onerror = function (ev) { hint.textContent = ev.error === "not-allowed" ? t.noMic : ""; };
      rec.onend = function () { micBtn.classList.remove("on"); hint.textContent = ""; if ((finalText || qi.value).trim()) ask(finalText || qi.value); };
      try { rec.start(); } catch (e) { hint.textContent = t.noMic; }
    });
  }

  function stageCard(stageId, lang) {
    if (!KB) return Promise.resolve("");
    var s = (KB.stages || []).filter(function (x) { return x.id === stageId; })[0]; if (!s) return "";
    function ul(a) { return "<ul>" + (a || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
    return '<div class="guide ak-stage"><div class="stage-name">' + esc(s.name_en) + " · " + esc(s.ages) + "</div>" +
      "<h3>🧠 " + (lang === "hi" ? "दिमाग़ में क्या हो रहा है" : "What's developing in the brain") + "</h3>" + ul(s.brain_en) +
      "<h3>🌱 " + (lang === "hi" ? "संस्कार और manners इस उम्र में" : "Values and manners at this age") + "</h3>" + ul(s.values_en) +
      "<h3>✅ " + (lang === "hi" ? "आप क्या करें" : "What you can do") + "</h3>" + ul(s.do_en) +
      '<div class="ak-src"><b>📎 ' + (lang === "hi" ? "स्रोत" : "Sources") + "</b><ul>" + (s.sources || []).map(function (x) {
        return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + "</a> <span>— " + esc(x.org) + "</span></li>";
      }).join("") + "</ul></div></div>";
  }

  window.ChamkuAsk = { mount: mount, load: load, stageCard: stageCard, search: function (q) { return search(q); } };
})();
