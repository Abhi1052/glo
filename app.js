/* Chamku — bedtime stories web app (beta v2, store-style layout). Plain JS, no build step. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var nav = document.getElementById("nav");
  var sheet = document.getElementById("sheet");
  var nightlight = document.getElementById("nightlight");
  var D = null;
  var PAGE = 24;

  /* ---------- words on screen ---------- */
  var T = {
    en: {
      tagline: "Chamku the storyteller", search: "Search stories, habits, feelings…",
      welcome: "Welcome to Chamku", welcomeText: "Every night, Chamku the firefly visits with a story made for your child's age.",
      language: "Language", childName: "Child's name (optional)", age: "Age", under1: "Under 1", year: "year", years: "years",
      begin: "Let's begin", skip: "Skip for now", privacy: "Your child's name and age stay on this phone only. No ads.",
      forName: "For {name}", forAge: "For {ages}", pickedFor: "Picked for {ages}", allAges: "All ages", all: "All",
      fbTitle: "How did your child find this story?", fbGot: "How well did your child understand the story?", fbGotLo: "1 = not at all", fbGotHi: "10 = fully", fbInt: "How interested was your child, from start to end?", fbIntLo: "1 = lost interest early", fbIntHi: "10 = hooked till the end", fbSend: "Submit", fbDone: "Sent", fbThanks: "Thank you! Your answer has been sent.", fbFail: "Could not send right now. We will try again automatically.", fbPick: "Please tap a number for both questions.", soon: "Coming soon", readyNow: "Ready", start: "▶ Watch", min: "min",
      builds: "Builds", why: "Why this helps", sources: "Sources", sample: "Meanwhile, watch our sample story",
      back: "← Back", talk: "Talk together",
      addChild: "Child's name & age", titleTag: "Chamku the Storyteller",
      watched: "Watched", tryLangs: "New: stories in Bengali & Marathi", mWatch: "Watch", mListen: "Listen only", mAlbum: "Bedtime stories", moreStories: "More stories →",
      listenNote: "You can lock the phone — the story keeps playing. Pause it or skip to the next story from the lock screen.",
      watchNote: "Chamku tells this story. He says hello, then shrinks to a tiny light, and the screen stays almost dark for the rest of the story — so it helps your child sleep instead of waking them up.",
      videoSoon: "Chamku's video for this story is being made.", script: "Read the story script (for testing)",
      endText: "The end... time to sleep.", nightOn: "🌙 Turn on the night light", goodnight: "Goodnight...", goBack: "Go back",
      childAt: "Your child at {ages}", now: "What's happening now", works: "Stories that work now",
      sleepH: "Sleep", screens: "Screens", tryTonight: "Try tonight", promises: "How Chamku is built",
      shelves: "The science behind each category", favs: "Saved", noFavs: "Tap ♥ on any story to save it here.",
      later: "Stories for this age are coming later.", langSoon: "coming soon", settings: "Child & language",
      babyNote: "Doctors advise no screens for babies. Play Chamku with the phone face down, so your baby hears only Chamku's voice.",
      routine: "Tonight's routine", routineSteps: "Bath · Book · Brush · Bed", routineWhy: "The same 4 steps every night helps children fall asleep faster.",
      footer: "Chamku beta · for friends and family · stories are being written",
      home: "Home", categories: "Categories", searchTab: "Search", parents: "Parents", ask: "Ask Chamku", askCta: "Ask Chamku", askCtaSub: "Your parenting questions, answered from child science — with links to the evidence. Free.",
      byAge: "Stories by age", seeAll: "See all", showMore: "Show more", stories: "stories", noResults: "No stories found. Try another word.",
      allCats: "All categories", results: "{n} stories", calmNow: "Calm & sleepy picks", classicsRow: "Classic tales"
    },
    hi: {
      tagline: "कहानी सुनाने वाला चमकू", search: "कहानी, आदत, भावना खोजें…",
      welcome: "चमकू में आपका स्वागत है", welcomeText: "हर रात जुगनू चमकू आता है — आपके बच्चे की उम्र के हिसाब से एक कहानी लेकर।",
      language: "भाषा", childName: "बच्चे का नाम (अगर चाहें)", age: "उम्र", under1: "1 साल से कम", year: "साल", years: "साल",
      begin: "चलिए शुरू करें", skip: "अभी छोड़ें", privacy: "बच्चे का नाम और उम्र सिर्फ़ इसी फ़ोन पर रहते हैं। कोई विज्ञापन नहीं।",
      forName: "{name} के लिए", forAge: "{ages} के लिए", pickedFor: "{ages} के लिए चुनी गईं", allAges: "सभी उम्र", all: "सब",
      fbTitle: "बच्चे को ये कहानी कैसी लगी?", fbGot: "बच्चे को कहानी कितनी समझ आई?", fbGotLo: "1 = बिल्कुल नहीं", fbGotHi: "10 = पूरी", fbInt: "शुरू से आख़िर तक बच्चे का मन कितना लगा रहा?", fbIntLo: "1 = जल्दी ऊब गया", fbIntHi: "10 = आख़िर तक मन लगा रहा", fbSend: "Submit करें", fbDone: "भेज दिया", fbThanks: "धन्यवाद! आपका जवाब भेज दिया गया है।", fbFail: "अभी नहीं भेज पाए। हम अपने आप फिर से कोशिश करेंगे।", fbPick: "कृपया दोनों सवालों के लिए एक number चुनिए।", soon: "जल्द आ रही है", readyNow: "तैयार", start: "▶ देखें", min: "मिनट",
      builds: "क्या सिखाती है", why: "ये क्यों मदद करता है", sources: "स्रोत", sample: "तब तक हमारी नमूना कहानी देखिए",
      back: "← वापस", talk: "साथ में बात करें",
      addChild: "बच्चे का नाम और उम्र", titleTag: "कहानी सुनाने वाला चमकू",
      watched: "देख ली", tryLangs: "नया: बंगाली और मराठी में कहानियाँ", mWatch: "देखें", mListen: "सिर्फ़ सुनें", mAlbum: "सोने की कहानियाँ", moreStories: "और कहानियाँ →",
      listenNote: "फ़ोन lock कर सकते हैं — कहानी चलती रहेगी। Lock screen से रोक सकते हैं या अगली कहानी चला सकते हैं।",
      watchNote: "ये कहानी चमकू सुनाता है। वो नमस्ते कहता है, फिर एक नन्ही-सी रोशनी बन जाता है, और बाकी कहानी में स्क्रीन लगभग अँधेरी रहती है — ताकि बच्चा जागे नहीं, सो जाए।",
      videoSoon: "इस कहानी का चमकू वाला वीडियो बन रहा है।", script: "कहानी की स्क्रिप्ट पढ़ें (टेस्टिंग के लिए)",
      endText: "कहानी ख़त्म... अब सोने का समय।", nightOn: "🌙 रात की रोशनी चालू करें", goodnight: "गुड नाइट...", goBack: "वापस जाएँ",
      childAt: "{ages} में आपका बच्चा", now: "अभी क्या हो रहा है", works: "अभी कैसी कहानियाँ काम करती हैं",
      sleepH: "नींद", screens: "स्क्रीन", tryTonight: "आज रात आज़माइए", promises: "चमकू कैसे बना है",
      shelves: "हर श्रेणी के पीछे का विज्ञान", favs: "सेव की गईं", noFavs: "किसी भी कहानी पर ♥ दबाइए, वो यहाँ दिखेगी।",
      later: "इस उम्र की कहानियाँ बाद में आएँगी।", langSoon: "जल्द", settings: "बच्चा और भाषा",
      babyNote: "डॉक्टर छोटे बच्चों के लिए स्क्रीन मना करते हैं। फ़ोन उल्टा रखकर चमकू चलाइए, ताकि बच्चा सिर्फ़ चमकू की आवाज़ सुने।",
      routine: "आज रात का रूटीन", routineSteps: "नहाना · कहानी · ब्रश · बिस्तर", routineWhy: "हर रात वही 4 काम करने से बच्चे जल्दी सो जाते हैं।",
      footer: "चमकू बीटा · दोस्तों और परिवार के लिए · कहानियाँ लिखी जा रही हैं",
      home: "होम", categories: "श्रेणियाँ", searchTab: "खोजें", parents: "माता-पिता", ask: "चमकू से पूछें", askCta: "चमकू से पूछिए", askCtaSub: "आपके parenting सवाल, child science से जवाब — सबूत के links के साथ। बिल्कुल free।",
      byAge: "उम्र के हिसाब से", seeAll: "सब देखें", showMore: "और दिखाएँ", stories: "कहानियाँ", noResults: "कोई कहानी नहीं मिली। कोई और शब्द आज़माइए।",
      allCats: "सारी श्रेणियाँ", results: "{n} कहानियाँ", calmNow: "शांत और नींद वाली कहानियाँ", classicsRow: "पुरानी कहानियाँ"
    }
  };

  /* ---------- storage ---------- */
  function load(k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  var S = { lang: load("glo.lang", null), child: load("glo.child", null), favs: load("glo.favs", []), size: load("glo.size", 20),
    parentStage: null, shown: PAGE, query: "" };

  function lang() { return S.lang || "en"; }
  function t(key, vars) {
    var s = (T[lang()] && T[lang()][key]) || T.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace("{" + k + "}", vars[k]); });
    return s;
  }
  function L(o) { return o ? (o[lang()] || o.en || "") : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function srcLinks(list) {
    if (!list || !list.length) return "";
    return ' <span class="src">' + list.map(function (n) {
      var s = D.sources.filter(function (x) { return x.n === n; })[0];
      return s ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" title="' + esc(s.title) + '">[' + n + "]</a>" : "";
    }).join("") + "</span>";
  }

  /* ---------- lookups ---------- */
  function stageForAge(a) {
    if (a === null || a === undefined || a === "") return null;
    a = Number(a); return a < 1 ? "s0" : a < 2 ? "s1" : a < 3 ? "s2" : a < 5 ? "s3" : a < 8 ? "s4" : "s5";
  }
  function myStage() { return S.child ? stageForAge(S.child.age) : null; }
  function stageObj(id) { return D.stages.filter(function (s) { return s.id === id; })[0]; }
  function cat(id) { return D.categories.filter(function (c) { return c.id === id; })[0]; }
  function topic(c, id) { return (D.topics[c] || []).filter(function (x) { return x.id === id; })[0]; }
  function story(id) { return D.stories.concat(D.extra || []).filter(function (s) { return s.id === id; })[0]; }
  function isFav(id) { return S.favs.indexOf(id) !== -1; }
  function watched() { try { return JSON.parse(localStorage.getItem("glo.watched") || "{}"); } catch (e) { return {}; } }
  function isWatched(id) { return !!watched()[id]; }
  function agesOf(s) {
    var st = s.stages.map(stageObj);
    if (st.length === 1) return L(st[0].ages);
    var last = L(st[st.length - 1].ages);
    return L(st[0].ages).split("–")[0] + "–" + (last.indexOf("–") > -1 ? last.split("–")[1] : last);
  }
  function inStage(s, st) { return !st || s.stages.indexOf(st) !== -1; }
  function readyFirst(a, b) { return (b.ready ? 1 : 0) - (a.ready ? 1 : 0); }

  /* ---------- building blocks ---------- */
  function card(s) {
    var c = cat(s.category), tp = topic(s.category, s.topic);
    return '<a class="card' + (s.ready ? " ready" : "") + '" href="#/s/' + s.id + '">' +
      '<div class="thumb c-' + s.category + '"><span>' + (s.icon || (tp ? tp.icon : c.icon)) + "</span>" + (s.ready ? '<i class="play">▶</i>' : "") + "</div>" +
      '<div class="cb"><h3>' + esc(L(s.title)) + (isFav(s.id) ? ' <span class="fav-mark">♥</span>' : "") + "</h3>" +
      '<div class="meta">' + esc(L(s.builds)) + "</div>" +
      (s.ready ? (isWatched(s.id) ? '<span class="badge seen">✓ ' + t("watched") + " · " + s.minutes + " " + t("min") + "</span>" : '<span class="badge ok">' + t("readyNow") + " · " + s.minutes + " " + t("min") + "</span>") : '<span class="badge">' + t("soon") + "</span>") +
      "</div></a>";
  }
  function grid(list) {
    if (!list.length) return '<p class="empty">' + t("later") + "</p>";
    var shown = list.slice(0, S.shown);
    return '<p class="count">' + t("results", { n: list.length }) + '</p><div class="grid">' + shown.map(card).join("") + "</div>" +
      (list.length > S.shown ? '<button class="pill ghost wide" data-act="more">' + t("showMore") + "</button>" : "");
  }
  function row(title, link, list) {
    if (!list.length) return "";
    return '<div class="row-h"><h2>' + title + "</h2>" + (link ? '<a href="' + link + '">' + t("seeAll") + " ›</a>" : "") + "</div>" +
      '<div class="row">' + list.map(card).join("") + "</div>";
  }
  function circle(href, icon, label, cls, on) {
    return '<a class="circle' + (on ? " on" : "") + '" href="' + href + '"><span class="disc ' + (cls || "") + '">' + icon + "</span><b>" + esc(label) + "</b></a>";
  }
  function header() {
    var st = myStage();
    var who = (S.child && S.child.name ? esc(S.child.name) + " · " : "") + (st ? esc(L(stageObj(st).ages)) : "");
    return '<header class="top"><button class="icon-btn menu-btn" data-act="menu" aria-label="Menu">☰</button><a class="brand" href="#/home"><img class="avatar" src="glo-face.webp" alt="Chamku"><h1>Chamku</h1></a>' +
      '<div class="top-r">' +
      '<button class="lang-btn" data-act="langtoggle">🌐 ' + esc(D.languages.filter(function (l) { return l.code === lang(); })[0].label) + "</button>" +
      '</div></header>';
  }

  /* ---------- HOME (store-style) ---------- */
  function pageHome() {
    var st = myStage();
    var circles = '<nav class="circles home-cats">' +
      D.categories.map(function (c) { return circle("#/c/" + c.id, c.icon, L(c.name), "c-" + c.id); }).join("") + "</nav>";
    var banners = '<div class="banners" id="banners">' + D.banners.map(function (b) {
      return '<a class="banner b-' + b.id + (b.img ? " has-img" : "") + '" href="' + b.link + '"' + (b.img ? ' style="background-image:linear-gradient(90deg,rgba(6,9,24,.94) 38%,rgba(6,9,24,.35) 75%,rgba(6,9,24,.1)),url(' + b.img + ')"' : "") + '><div class="b-ic">' + b.icon + "</div><div><h2>" + esc(L(b.title)) + "</h2><p>" + esc(L(b.text)) + "</p></div></a>";
    }).join("") + '</div><div class="dots">' + D.banners.map(function (b, i) { return '<i class="' + (i === 0 ? "on" : "") + '"></i>'; }).join("") + "</div>";
    var quads = '<div class="quads">' + D.quads.map(function (q) {
      var c = cat(q.cat);
      return '<div class="quad"><h3>' + c.icon + " " + esc(L(c.name)) + '</h3><div class="q4">' + q.topics.map(function (tid) {
        var tp = topic(q.cat, tid);
        return '<a href="#/c/' + q.cat + "/" + tid + '"><span class="qt c-' + q.cat + '">' + tp.icon + "</span><b>" + esc(L(tp.name)) + "</b></a>";
      }).join("") + '</div><a class="q-all" href="#/c/' + q.cat + '">' + t("seeAll") + " ›</a></div>";
    }).join("") + "</div>";
    var ages = '<div class="row-h"><h2>' + t("byAge") + '</h2></div><nav class="ages">' + D.stages.map(function (s) {
      return '<a class="age-card' + (s.id === st ? " on" : "") + '" href="#/age/' + s.id + '"><b>' + esc(L(s.ages)) + "</b><span>" + esc(L(s.name)) + "</span></a>";
    }).join("") + "</nav>";
    var picked = D.stories.filter(function (s) { return inStage(s, st); }).sort(readyFirst).slice(0, 10);
    var calm = D.stories.filter(function (s) { return s.category === "sleep" && inStage(s, st); }).slice(0, 10);
    var classics = D.stories.filter(function (s) { return s.category === "classics"; }).sort(readyFirst).slice(0, 10);
    var favs = D.stories.filter(function (s) { return isFav(s.id); });
    return header() + circles + '<a class="searchbar" href="#/search">🔍 <span>' + t("search") + "</span></a>" +
      ((D.extra || []).length ? row("🌏 " + t("tryLangs"), "", D.extra) : "") + banners +
      (st === "s0" ? '<div class="note">' + t("babyNote") + srcLinks([4]) + "</div>" : "") +
      row(st ? t("pickedFor", { ages: esc(L(stageObj(st).ages)) }) : t("allAges"), st ? "#/age/" + st : "#/cats", picked) +
      quads + ages +
      row(t("calmNow"), "#/c/sleep", calm) +
      '<div class="routine"><div class="label">' + t("routine") + "</div><strong>" + t("routineSteps") + "</strong><p>" + t("routineWhy") + srcLinks([16, 7]) + "</p></div>" +
      row(t("classicsRow"), "#/c/classics", classics) +
      (favs.length ? row("♥ " + t("favs"), "#/favs", favs) : "") +
      '<p class="foot">' + t("footer") + "</p>";
  }

  /* ---------- CATEGORY LIST ---------- */
  function pageCats() {
    return header() + '<h2 class="page-title">' + t("allCats") + '</h2><div class="cat-grid">' + D.categories.map(function (c) {
      var n = D.stories.filter(function (s) { return s.category === c.id; }).length;
      return '<a class="cat-tile c-' + c.id + '" href="#/c/' + c.id + '"><span>' + c.icon + "</span><b>" + esc(L(c.name)) + "</b><i>" + n + " " + t("stories") + "</i></a>";
    }).join("") + "</div>" + '<p class="foot">' + t("footer") + "</p>";
  }

  /* ---------- ONE CATEGORY (with sub-topics + age filter) ---------- */
  var filterAge = undefined;
  function ageChips(base) {
    var sel = filterAge === undefined ? myStage() : filterAge;
    return '<nav class="chips">' + '<a class="chip" href="' + base + '" data-age="" aria-pressed="' + !sel + '">' + t("allAges") + "</a>" +
      D.stages.map(function (s) { return '<a class="chip" href="' + base + '" data-age="' + s.id + '" aria-pressed="' + (s.id === sel) + '">' + esc(L(s.ages)) + "</a>"; }).join("") + "</nav>";
  }
  function pageCat(cid, tid) {
    var c = cat(cid); if (!c) return pageCats();
    var sel = filterAge === undefined ? myStage() : filterAge;
    var list = D.stories.filter(function (s) { return s.category === cid && (!tid || s.topic === tid) && inStage(s, sel); }).sort(readyFirst);
    var topics = '<nav class="circles small">' + circle("#/c/" + cid, c.icon, t("all"), "c-" + cid, !tid) +
      (D.topics[cid] || []).map(function (tp) { return circle("#/c/" + cid + "/" + tp.id, tp.icon, L(tp.name), "c-" + cid, tp.id === tid); }).join("") + "</nav>";
    return header() +
      '<div class="cat-banner c-' + cid + '"><span>' + c.icon + "</span><div><h2>" + esc(L(c.name)) + (tid ? " · " + esc(L(topic(cid, tid).name)) : "") + "</h2><p>" + esc(L(c.what)) + "</p></div></div>" +
      '<details class="why"><summary>🔬 ' + t("why") + "</summary><p>" + esc(L(c.why)) + srcLinks(c.why.src) + "</p></details>" +
      topics + ageChips(location.hash) + grid(list) + (cid === "sleep" ? '<button class="pill ghost" data-act="night">' + t("nightOn") + "</button>" : "") +
      '<p class="foot">' + t("footer") + "</p>";
  }

  /* ---------- BY AGE ---------- */
  function pageAge(sid) {
    var st = stageObj(sid); if (!st) return pageHome();
    var list = D.stories.filter(function (s) { return inStage(s, sid); }).sort(readyFirst);
    return header() + '<div class="cat-banner c-star"><span>⭐</span><div><h2>' + esc(L(st.ages)) + " · " + esc(L(st.name)) + "</h2><p>" + esc(L(st.stories)) + "</p></div></div>" +
      '<nav class="circles small">' + D.categories.map(function (c) { return circle("#/c/" + c.id, c.icon, L(c.name), "c-" + c.id); }).join("") + "</nav>" +
      (st.later ? '<p class="empty">' + t("later") + "</p>" : "") + grid(list) + '<p class="foot">' + t("footer") + "</p>";
  }

  /* ---------- SEARCH ---------- */
  function searchList(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    return D.stories.filter(function (s) {
      var tp = topic(s.category, s.topic), c = cat(s.category);
      var hay = [s.title.en, s.title.hi, s.builds.en, s.builds.hi, tp && tp.name.en, tp && tp.name.hi, c.name.en, c.name.hi].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    }).sort(readyFirst);
  }
  function pageSearch() {
    return header().replace(/<a class="searchbar"[\s\S]*?<\/a>/, "") +
      '<div class="searchbox"><span>🔍</span><input id="q" type="search" autocomplete="off" placeholder="' + esc(t("search")) + '" value="' + esc(S.query) + '"></div>' +
      '<div id="results">' + (S.query ? (searchList(S.query).length ? grid(searchList(S.query)) : '<p class="empty">' + t("noResults") + "</p>") :
        '<nav class="circles">' + D.categories.map(function (c) { return circle("#/c/" + c.id, c.icon, L(c.name), "c-" + c.id); }).join("") + "</nav>") + "</div>";
  }

  function pageFavs() {
    var favs = D.stories.filter(function (s) { return isFav(s.id); });
    return header() + '<h2 class="page-title">♥ ' + t("favs") + "</h2>" + (favs.length ? '<div class="grid">' + favs.map(card).join("") + "</div>" : '<p class="empty">' + t("noFavs") + "</p>");
  }

  /* ---------- PARENTS / SCIENCE ---------- */
  function pageParents() {
    var sel = S.parentStage || myStage() || "s3", st = stageObj(sel);
    function li(items) { return "<ul>" + items.map(function (g) { return "<li>" + esc(L(g)) + srcLinks(g.src) + "</li>"; }).join("") + "</ul>"; }
    return header() + '<a class="ask-cta" href="#/ask"><img src="glo-face.webp" alt=""><div><b>💬 ' + t("askCta") + '</b><span>' + t("askCtaSub") + '</span></div></a>' +
      '<h2 class="page-title">' + t("childAt", { ages: esc(L(st.ages)) }) + "</h2>" +
      '<nav class="chips">' + D.stages.map(function (s) { return '<button class="chip" data-stage="' + s.id + '" aria-pressed="' + (s.id === sel) + '">' + esc(L(s.ages)) + "</button>"; }).join("") + "</nav>" +
      '<div class="guide"><div class="stage-name">' + esc(L(st.name)) + (st.later ? " · " + t("soon") : "") + "</div>" +
      "<h3>" + t("now") + "</h3>" + li(st.growing) + "<h3>" + t("works") + "</h3><p>" + esc(L(st.stories)) + srcLinks(st.stories.src) + "</p>" +
      '<div class="facts"><div><h4>😴 ' + t("sleepH") + "</h4><p>" + esc(L(st.sleep)) + srcLinks(st.sleep.src) + "</p></div>" +
      "<div><h4>📱 " + t("screens") + "</h4><p>" + esc(L(st.screens)) + srcLinks(st.screens.src) + "</p></div></div>" +
      '<div class="try"><h4>✨ ' + t("tryTonight") + "</h4><p>" + esc(L(st.tonight)) + srcLinks(st.tonight.src) + "</p></div></div>" +
      '<div id="ak-stage" data-stage="' + sel + '"></div>' +
      '<h2 class="page-title">' + t("promises") + '</h2><ol class="promises">' + D.promises.map(function (p) { return "<li>" + esc(L(p)) + srcLinks(p.src) + "</li>"; }).join("") + "</ol>" +
      '<h2 class="page-title">' + t("shelves") + "</h2>" + D.categories.map(function (c) {
        return '<div class="sci"><h4>' + c.icon + " " + esc(L(c.name)) + "</h4><p>" + esc(L(c.why)) + srcLinks(c.why.src) + "</p></div>";
      }).join("") +
      '<h2 class="page-title">' + t("sources") + '</h2><ol class="sources">' + D.sources.map(function (s) {
        return '<li value="' + s.n + '"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + "</a></li>";
      }).join("") + "</ol>" + '<button class="pill ghost" data-act="settings">⚙️ ' + t("settings") + "</button>" + '<p class="foot">' + t("footer") + "</p>";
  }

  /* ---------- MEET GLO (backstory) ---------- */
  function pageAbout() {
    var a = D.about;
    return header() + '<div class="about-hero" style="background-image:url(glo-hero.webp)"></div>' +
      '<h2 class="page-title">' + esc(L(a.title)) + "</h2>" + L(a.story).split("\n").map(function (p) { return '<p class="about-p">' + esc(p) + "</p>"; }).join("") +
      '<img class="about-img" src="glo-comfort.webp" alt="">' +
      '<h2 class="page-title">' + esc(L(a.friendsTitle)) + '</h2><div class="friends">' + a.friends.map(function (f) {
        return '<div class="friend"><span>' + f.icon + "</span><div><b>" + esc(L(f.name)) + "</b><p>" + esc(L(f.about)) + "</p></div></div>";
      }).join("") + "</div>" +
      '<div class="promise"><img src="glo-sleepy.webp" alt=""><p>' + esc(L(a.promise)) + "</p></div>" + '<p class="foot">' + t("footer") + "</p>";
  }

  /* ---------- STORY ---------- */
  function pageInfo(s) {
    var c = cat(s.category), tp = topic(s.category, s.topic);
    return '<div class="bar"><a class="icon-btn" href="#/c/' + c.id + '">' + t("back") + '</a><button class="icon-btn" data-act="fav" data-id="' + s.id + '" aria-pressed="' + isFav(s.id) + '">♥</button></div>' +
      '<div class="thumb big c-' + s.category + '"><span>' + (s.icon || (tp ? tp.icon : c.icon)) + "</span></div>" +
      '<div class="story-head"><h1>' + esc(L(s.title)) + '</h1><div class="meta">' + esc(L(c.name)) + (tp ? " · " + esc(L(tp.name)) : "") + '</div><span class="badge">' + t("soon") + "</span></div>" +
      '<div class="guide"><h3>' + t("builds") + "</h3><p>" + esc(L(s.builds)) + "</p><h3>" + t("why") + "</h3><p>" + esc(L(c.why)) + srcLinks(c.why.src) + "</p></div>" +
      '<a class="pill" href="#/s/anaya-brushu">' + t("sample") + " →</a>";
  }

  // ---- feedback goes to the Chamku Google Form (answers land in a Google Sheet) ----
  var FB = window.CHAMKU_FB || null;
  window.chamkuSendFeedback = function (rec, cb) {
    function post(r) {
      if (!FB || !FB.action) return Promise.reject("no form");
      var body = new URLSearchParams();
      Object.keys(FB.fields).forEach(function (k) { body.append(FB.fields[k], r[k] || ""); });
      return fetch(FB.action, { method: "POST", mode: "no-cors", body: body });
    }
    var q = []; try { q = JSON.parse(localStorage.getItem("chamku_fb_q") || "[]"); } catch (e) {}
    post(rec).then(function () { cb && cb(true); flush(); }, function () {
      q.push(rec); try { localStorage.setItem("chamku_fb_q", JSON.stringify(q)); } catch (e) {}
      cb && cb(false);
    });
    function flush() {
      var left = []; try { left = JSON.parse(localStorage.getItem("chamku_fb_q") || "[]"); } catch (e) {}
      if (!left.length) return; try { localStorage.setItem("chamku_fb_q", "[]"); } catch (e) {}
      left.forEach(function (r) { post(r).catch(function () {}); });
    }
  };

  function feedback(s) {
    function scale(k, lo, hi) {
      var h = '<div class="fb-scale" style="display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:6px 0 2px">';
      for (var n = 1; n <= 10; n++) h += '<button type="button" class="pill ghost fb" style="padding:10px 0;min-width:0;justify-content:center" data-act="fb" data-k="' + k + '" data-v="' + n + '">' + n + "</button>";
      return h + '</div><div class="small muted" style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px"><span>' + t(lo) + "</span><span>" + t(hi) + "</span></div>";
    }
    return '<div class="talk fbbox" data-id="' + s.id + '"><h3>📝 ' + t("fbTitle") + "</h3>" +
      "<p><b>" + t("fbGot") + "</b></p>" + scale("got", "fbGotLo", "fbGotHi") +
      "<p><b>" + t("fbInt") + "</b></p>" + scale("int", "fbIntLo", "fbIntHi") +
      '<p id="fb-msg" class="small muted"></p><button type="button" class="pill wide" data-act="fbsend">' + t("fbSend") + "</button></div>";
  }
  function listenMode() { try { return localStorage.getItem("glo.mode") === "listen"; } catch (e) { return false; } }
  function modeTabs() {
    var l = listenMode();
    return '<div class="mode-tabs" role="tablist"><button type="button" data-lp="mode" data-m="watch" class="' + (l ? "" : "on") + '">📺 ' + t("mWatch") + "</button>" +
      '<button type="button" data-lp="mode" data-m="listen" class="' + (l ? "on" : "") + '">🎧 ' + t("mListen") + "</button></div>";
  }
  function listenBox(s) {
    return '<div class="listen" data-id="' + s.id + '"><div class="lp-art"><span>' + (s.icon || "🌙") + "</span></div>" +
      '<div class="lp-row"><button type="button" class="lp-btn lp-play" data-lp="play" aria-label="Play">▶</button>' +
      '<button type="button" class="lp-btn lp-next" data-lp="next" aria-label="Next story">⏭</button></div>' +
      '<input class="lp-seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Seek">' +
      '<div class="lp-time small muted"><span class="lp-cur">0:00</span><span class="lp-dur"></span></div></div>';
  }
  // a few more from the same shelf first, then a mix from the other shelves
  function moreList(s) {
    var R = D.stories.filter(function (x) { return x.ready && D.bodies[x.id] && x.id !== s.id; });
    var shelf = D.stories.filter(function (x) { return x.ready && D.bodies[x.id] && x.category === s.category; });
    var i = shelf.map(function (x) { return x.id; }).indexOf(s.id);
    var same = shelf.slice(i + 1).concat(shelf.slice(0, Math.max(i, 0))).filter(function (x) { return x.id !== s.id; }).slice(0, 3);
    var others = {}, seed = 0, pick = [];
    R.forEach(function (x) { if (x.category !== s.category) (others[x.category] = others[x.category] || []).push(x); });
    for (var k = 0; k < s.id.length; k++) seed += s.id.charCodeAt(k);
    var cats = Object.keys(others);
    cats.forEach(function (c) { var a = others[c], r = seed % a.length; others[c] = a.slice(r).concat(a.slice(0, r)); });
    if (cats.length) { var rot = seed % cats.length; cats = cats.slice(rot).concat(cats.slice(0, rot)); }
    for (var round = 0; pick.length < 10 && round < 30; round++) cats.forEach(function (c) { if (pick.length < 10 && others[c][round]) pick.push(others[c][round]); });
    var all = same.concat(pick), w = watched();
    return all.filter(function (x) { return !w[x.id]; }).concat(all.filter(function (x) { return w[x.id]; }));   // new stories first
  }
  function moreRow(s) {
    var l = moreList(s); if (!l.length) return "";
    return '<h2 class="row-title">' + t("moreStories") + '</h2><div class="row more-row">' + l.map(card).join("") + "</div>";
  }
  window.chamkuMore = function (id) { var s = story(id); return s ? moreList(s).map(function (x) { return x.id; }) : []; };
  window.chamkuInfo = function (id) {
    var s = story(id), b = s && D.bodies[id]; if (!b) return null;
    return { id: id, title: L(s.title), icon: s.icon || "🌙", vid: b.video && (b.video[lang()] || b.video.en) };
  };
  window.chamkuT = function (k) { return t(k); };
  window.chamkuRender = function () { render(true); };
  window.chamkuSetLang = function (code) { S.lang = code; save("glo.lang", code); render(true); };
  function pageStory(s) {
    var b = D.bodies[s.id], parts = b.parts[lang()] || b.parts.en, c = cat(s.category);
    var vid = b.video && (b.video[lang()] || b.video.en);
    var player = vid ? '<video class="player" controls playsinline preload="none" src="' + esc(vid) + '"></video>'
      : '<div class="player soon" style="background-image:url(glo-hero.webp)"><p>' + t("videoSoon") + "</p></div>";
    var body = parts.map(function (p) {
      return '<section class="part"><h2>' + esc(p.heading) + '</h2><div class="dir">(' + esc(p.direction) + ")</div>" +
        p.text.split("\n").map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + "</section>";
    }).join("");
    return '<div class="story-page"><div class="bar"><span class="bar-l"><button class="icon-btn menu-btn" data-act="menu" aria-label="Menu">☰</button><a class="icon-btn" href="#/c/' + c.id + '">' + t("back") + '</a><a class="icon-btn home-btn" href="#/home" aria-label="' + t("home") + '">🏠 ' + t("home") + "</a></span>" +
      '<button class="icon-btn" data-act="fav" data-id="' + s.id + '" aria-pressed="' + isFav(s.id) + '">♥</button></div>' +
      '<div class="story-head"><h1>' + esc(L(s.title)) + '</h1><div class="meta">' + esc(L(b.source)) + " · " + s.minutes + " " + t("min") + "</div></div>" +
      (vid ? modeTabs() : "") + (vid && listenMode() ? listenBox(s) : player) +
      '<p class="small muted">' + (vid && listenMode() ? "🔒 " + t("listenNote") : "🌙 " + t("watchNote") + srcLinks([17, 6])) + "</p>" + moreRow(s) +
      '<div class="talk"><h3>💬 ' + t("talk") + "</h3><p>" + esc(L(b.talk)) + srcLinks([8, 14]) + "</p></div>" +
      '<details class="script"><summary>📜 ' + t("script") + '</summary><div class="tools"><button class="icon-btn" data-act="smaller">A−</button><button class="icon-btn" data-act="bigger">A+</button></div>' + body + "</details>" + feedback(s) +
      '<div class="end"><img class="end-img" src="glo-lying.webp" alt=""><p>' + t("endText") + '</p><button class="pill ghost" data-act="night">' + t("nightOn") + "</button></div></div>";
  }

  /* ---------- settings sheet ---------- */
  function openSettings(first) {
    var opts = '<option value="">—</option><option value="0">' + t("under1") + "</option>";
    for (var a = 1; a <= 10; a++) opts += '<option value="' + a + '">' + a + " " + (a === 1 ? t("year") : t("years")) + "</option>";
    sheet.innerHTML = '<div class="sheet-card"><img class="sheet-img" src="glo-hero.webp" alt="Chamku"><h2>' + t("welcome") + "</h2><p>" + t("welcomeText") + "</p>" +
      "<label>" + t("language") + '<select id="f-lang">' + D.languages.map(function (l) {
        return '<option value="' + l.code + '"' + (l.ready ? "" : " disabled") + (l.code === lang() ? " selected" : "") + ">" + esc(l.label) + (l.ready ? "" : " (" + t("langSoon") + ")") + "</option>";
      }).join("") + "</select></label>" +
      "<label>" + t("childName") + '<input id="f-name" maxlength="30" autocomplete="off" value="' + esc(S.child && S.child.name || "") + '"></label>' +
      "<label>" + t("age") + '<select id="f-age">' + opts + "</select></label>" +
      '<p class="small muted">🔒 ' + t("privacy") + srcLinks([26]) + "</p>" +
      '<button class="pill wide" id="f-go">' + t("begin") + '</button><button class="link" id="f-skip">' + (first ? t("skip") : t("back")) + "</button></div>";
    if (S.child && S.child.age !== null && S.child.age !== undefined) sheet.querySelector("#f-age").value = String(S.child.age);
    sheet.hidden = false;
    sheet.querySelector("#f-lang").addEventListener("change", function (e) { S.lang = e.target.value; save("glo.lang", S.lang); openSettings(first); });
    sheet.querySelector("#f-go").addEventListener("click", function () {
      var age = sheet.querySelector("#f-age").value;
      S.child = { name: sheet.querySelector("#f-name").value.trim(), age: age === "" ? null : Number(age) };
      S.lang = sheet.querySelector("#f-lang").value; save("glo.child", S.child); save("glo.lang", S.lang);
      sheet.hidden = true; S.parentStage = null; filterAge = undefined; route();
    });
    sheet.querySelector("#f-skip").addEventListener("click", function () {
      if (!S.lang) { S.lang = "en"; save("glo.lang", "en"); }
      if (!S.child) { S.child = { name: "", age: null }; save("glo.child", S.child); }
      sheet.hidden = true; route();
    });
  }

  /* ---------- night light ---------- */
  var wakeLock = null;
  function openNight() {
    nightlight.querySelector(".nl-text").textContent = t("goodnight");
    nightlight.querySelector(".nl-exit").textContent = t("goBack");
    [nightlight.querySelector(".nl-dot"), nightlight.querySelector(".nl-text")].forEach(function (n) { n.style.animation = "none"; void n.offsetWidth; n.style.animation = ""; });
    nightlight.hidden = false;
    try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {}); } catch (e) { /* ignore */ }
    try { if ("wakeLock" in navigator) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; }).catch(function () {}); } catch (e) { /* ignore */ }
  }
  nightlight.querySelector(".nl-exit").addEventListener("click", function () {
    nightlight.hidden = true;
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ }
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) { /* ignore */ }
  });

  /* ---------- banner carousel ---------- */
  var bannerTimer = null;
  function startBanners() {
    clearInterval(bannerTimer);
    var el = document.getElementById("banners"); if (!el) return;
    var dots = document.querySelectorAll(".dots i");
    function mark() { var i = Math.round(el.scrollLeft / el.clientWidth); dots.forEach(function (d, j) { d.className = j === i ? "on" : ""; }); }
    el.addEventListener("scroll", mark, { passive: true });
    bannerTimer = setInterval(function () {
      if (!document.body.contains(el)) { clearInterval(bannerTimer); return; }
      var i = Math.round(el.scrollLeft / el.clientWidth), n = el.children.length;
      el.scrollTo({ left: ((i + 1) % n) * el.clientWidth, behavior: "smooth" });
    }, 5000);
  }

  window.chamkuOpenSettings = function () { openSettings(false); };
  /* ---------- clicks & typing ---------- */
  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act],[data-stage],[data-age]"); if (!b) return;
    if (b.hasAttribute("data-age")) { e.preventDefault(); filterAge = b.getAttribute("data-age") || null; S.shown = PAGE; render(true); return; }
    if (b.hasAttribute("data-stage")) { S.parentStage = b.getAttribute("data-stage"); render(true); return; }
    var act = b.getAttribute("data-act");
    if (act === "menu") { if (window.ChamkuMenu) window.ChamkuMenu.open(D, lang()); return; }
    if (act === "langtoggle") {
      var rl = D.languages.filter(function (l) { return l.ready; });
      if (rl.length === 2) window.chamkuSetLang(rl[0].code === lang() ? rl[1].code : rl[0].code); else openSettings(false);
      return;
    }
    if (act === "settings") openSettings(false);
    else if (act === "night") openNight();
    else if (act === "more") { S.shown += PAGE; render(true); }
    else if (act === "fb") {
      var box = b.closest(".fbbox"); box.querySelectorAll('[data-k="' + b.getAttribute("data-k") + '"]').forEach(function (x) { x.classList.remove("on"); x.style.background = ""; });
      b.classList.add("on"); b.style.background = "rgba(255,200,90,.35)";
    } else if (act === "fbsend") {
      var bx = b.closest(".fbbox"), sid = bx.getAttribute("data-id"), st = story(sid);
      var gt = bx.querySelector('.on[data-k="got"]'), it = bx.querySelector('.on[data-k="int"]');
      if (!gt || !it) { bx.querySelector("#fb-msg").textContent = t("fbPick"); return; }
      var rec = { story: st.title.en + " [" + sid + "]", got: gt.getAttribute("data-v"), int: it.getAttribute("data-v"), lang: lang() };
      window.chamkuSendFeedback(rec, function (ok) {
        bx.querySelector("#fb-msg").textContent = t(ok ? "fbThanks" : "fbFail");
        if (ok) { b.disabled = true; b.textContent = "✅ " + t("fbDone"); }
      });
    }

    else if (act === "fav") {
      var id = b.getAttribute("data-id");
      S.favs = isFav(id) ? S.favs.filter(function (x) { return x !== id; }) : S.favs.concat([id]);
      save("glo.favs", S.favs); b.setAttribute("aria-pressed", String(isFav(id)));
    } else if (act === "bigger" || act === "smaller") {
      S.size = Math.max(15, Math.min(32, S.size + (act === "bigger" ? 2 : -2)));
      save("glo.size", S.size); document.documentElement.style.setProperty("--story-size", S.size + "px");
    }
  });
  app.addEventListener("input", function (e) {
    if (e.target.id !== "q") return;
    S.query = e.target.value; S.shown = PAGE;
    var list = searchList(S.query);
    document.getElementById("results").innerHTML = S.query ? (list.length ? grid(list) : '<p class="empty">' + t("noResults") + "</p>") : "";
  });

  /* ---------- router ---------- */
  var lastRoute = "";
  function render(keep) { var y = window.scrollY; route(true); if (keep) window.scrollTo(0, y); }
  function route(same) {
    document.documentElement.lang = lang();
    document.documentElement.style.setProperty("--story-size", S.size + "px");
    var h = location.hash || "#/home";
    if (!same && h !== lastRoute) { S.shown = PAGE; if (!/^#\/c\//.test(h) || !/^#\/c\//.test(lastRoute)) filterAge = undefined; }
    lastRoute = h;
    var m, html, tab = "home";
    if ((m = h.match(/^#\/s\/([\w-]+)/))) {
      var s = story(m[1]); if (!s) { location.hash = "#/home"; return; }
      nav.hidden = true;
      app.innerHTML = '<div class="wrap">' + (s.ready && D.bodies[s.id] ? pageStory(s) : pageInfo(s)) + "</div>";
      document.title = L(s.title) + " — Chamku"; window.scrollTo(0, 0); return;
    }
    if ((m = h.match(/^#\/c\/(\w+)(?:\/(\w+))?/))) { html = pageCat(m[1], m[2]); tab = "cats"; }
    else if ((m = h.match(/^#\/age\/(\w+)/))) { html = pageAge(m[1]); tab = "home"; }
    else if (h.indexOf("#/cats") === 0) { html = pageCats(); tab = "cats"; }
    else if (h.indexOf("#/search") === 0) { html = pageSearch(); tab = "search"; }
    else if (h.indexOf("#/favs") === 0) { html = pageFavs(); tab = "favs"; }
    else if (h.indexOf("#/parents") === 0) { html = pageParents(); tab = "parents"; }
    else if (h.indexOf("#/report") === 0) { html = '<h1 class="page-title">Story report</h1><div id="ca-report">Loading…</div>'; tab = "home"; }
    else if (h.indexOf("#/science") === 0) { html = header() + '<h1 class="page-title">🔬 ' + (lang() === "hi" ? "विज्ञान लाइब्रेरी" : "Science library") + '</h1><div id="sci-lib">Loading…</div>'; tab = "parents"; }
    else if (h.indexOf("#/ask") === 0) { html = '<div id="ask-root"></div>'; tab = "ask"; }
    else if (h.indexOf("#/about") === 0) { html = pageAbout(); tab = "home"; }
    else html = pageHome();
    app.innerHTML = '<div class="wrap">' + html + "</div>";
    nav.innerHTML = [["home", "🏠", t("home")], ["cats", "🗂️", t("categories")], ["search", "🔍", t("searchTab")], ["ask", "💬", t("ask")], ["parents", "🔬", t("parents")]]
      .map(function (x) { return '<a href="#/' + x[0] + '" class="' + (x[0] === tab ? "on" : "") + '"><span>' + x[1] + "</span>" + esc(x[2]) + "</a>"; }).join("");
    nav.hidden = false;
    document.title = t("titleTag");
    if (!same) window.scrollTo(0, 0);
    if (tab === "search" && !same) { var q = document.getElementById("q"); if (q) q.focus(); }
    startBanners();
    if (window.ChamkuAsk) {
      var ar = document.getElementById("ask-root");
      if (ar) window.ChamkuAsk.mount(ar, { lang: lang() });
      var sg = document.getElementById("ak-stage");
      if (sg) window.ChamkuAsk.load().then(function () { sg.innerHTML = window.ChamkuAsk.stageCard(sg.getAttribute("data-stage"), lang()); });
    }
  }

  window.addEventListener("hashchange", function () { route(false); });
  fetch("data.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    D = d; route(false);
  }).catch(function () { app.innerHTML = '<div class="wrap"><p class="empty">Could not load Chamku. Please check your internet and open again.</p></div>'; });
  if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
})();
