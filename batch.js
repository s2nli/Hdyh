(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (v = "") => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const params = new URLSearchParams(location.search);
  const batchId = params.get("id") || "";
  const ICON = {
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="13" height="12" rx="3"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  };

  let batch = null, meta = null;
  let state = { tab: "lectures", s: null };
  let curList = [], filterText = "";

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200); }

  async function init() {
    // API-backed batches (ids look like r-297) are handled by remote-batch.js
    if (/^r-[A-Za-z0-9_]+$/.test(batchId) && window.CXRemote && window.CXRemote.mountDetail) return window.CXRemote.mountDetail({ batchId, params, esc, toast });
    if (!/^[a-z0-9-]+$/i.test(batchId)) return fail("Batch not found.");
    try {
      const [dRes, bRes] = await Promise.all([fetch("data/" + batchId + ".json"), fetch("batches.json").catch(() => null)]);
      if (!dRes.ok) throw new Error("not found");
      batch = await dRes.json();
      try { const bj = bRes && (await bRes.json()); meta = (bj.batches || []).find((b) => b._id === batchId) || null; } catch (e) {}
    } catch (e) { return fail("This batch could not be loaded. Please go back and try again."); }
    document.title = batch.name + " — CODEX STUDYS";
    trackRecent();
    buildFlat();
    const h = readHash();
    state = h;
    history.replaceState(state, "");
    render();
    const dl = location.hash.match(/[#&]lec=(\d+)/);
    if (dl) {
      history.replaceState(state, "", "#tab=" + state.tab + (state.s !== null ? "&s=" + state.s : ""));
      const fi = +dl[1], f = flat[fi];
      if (f && !f.pdf) openLecture(fi, { startAt: resumePos(fi), autoplay: true });
    }
  }

  function fail(msg) { $("#topTitle").textContent = "Batch"; $("#page").innerHTML = '<div class="empty">' + esc(msg) + "</div>"; }

  function readHash() {
    const m = location.hash.match(/tab=(lectures|notes|about)(?:&s=(\d+))?/);
    return { tab: m ? m[1] : "lectures", s: m && m[2] !== undefined ? +m[2] : null };
  }
  function go(tab, s) {
    state = { tab, s: s === undefined ? null : s };
    filterText = "";
    history.pushState(state, "", "#tab=" + tab + (state.s !== null ? "&s=" + state.s : ""));
    render(); window.scrollTo(0, 0);
  }
  window.addEventListener("popstate", (e) => {
    if (!batch) return; // remote batches (remote-batch.js) manage their own history
    if ($("#lv").classList.contains("open") && !(e.state && e.state.p)) closeOverlay(true);
    state = (e.state && e.state.tab) ? { tab: e.state.tab, s: e.state.s === undefined ? null : e.state.s } : readHash();
    filterText = ""; render();
  });
  $("#backBtn").addEventListener("click", () => {
    if (state.s !== null) { history.back(); return; }
    if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) history.back();
    else location.href = "index.html#courses";
  });

  function trackRecent() {
    try {
      const k = "codex-studys-recent";
      const arr = JSON.parse(localStorage.getItem(k) || "[]").filter((x) => x._id !== batchId);
      arr.unshift({ _id: batchId, name: batch.name, byName: batch.by || "", language: (meta && meta.language) || "", previewImage: (meta && meta.previewImage) || "" });
      localStorage.setItem(k, JSON.stringify(arr.slice(0, 8)));
    } catch (e) {}
  }

  const total = (groups) => groups.reduce((n, g) => n + g.i.length, 0);

  function render() {
    const page = $("#page");
    const groups = state.tab === "notes" ? batch.notes : batch.lectures;
    const inSubject = state.s !== null && state.tab !== "about" && groups[state.s];
    $("#topTitle").textContent = inSubject ? groups[state.s].n : batch.name;
    if (inSubject) { page.innerHTML = renderItems(groups[state.s]); bindItems(groups[state.s]); return; }
    const img = (meta && meta.previewImage) || "assets/batch-" + batchId + ".webp";
    let html = '<div class="hero"><img class="hero-img" src="' + esc(img) + '" alt="' + esc(batch.name) + '" onerror="this.src=\'assets/codex-telegram.png\'">' +
      '<div class="hero-body"><h2 class="hero-title">' + esc(batch.name) + '</h2><p class="hero-sub">' + esc(batch.by || "") + '</p>' +
      '<div class="badges"><span class="badge accent">Recorded</span><span class="badge">' + esc((meta && meta.language) || "Hinglish") + '</span></div></div></div>' +
      '<div class="tabs">' + ["lectures", "notes", "about"].map((t) => '<button class="tab' + (state.tab === t ? " active" : "") + '" data-tab="' + t + '" type="button">' + t[0].toUpperCase() + t.slice(1) + "</button>").join("") + "</div>";
    if (state.tab === "about") html += renderAbout();
    else html += '<div class="list">' + (groups.length ? groups.map((g, i) => subjectRow(g, i)).join("") : '<div class="empty">Nothing here yet.</div>') + "</div>";
    page.innerHTML = html;
    page.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => { if (b.dataset.tab !== state.tab) go(b.dataset.tab); }));
    page.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => go(state.tab, +b.dataset.s)));
  }

  function subjectRow(g, i) {
    const notes = state.tab === "notes";
    const n = g.i.length;
    if (notes) return '<button class="row" type="button" data-s="' + i + '"><span class="ico pdf">' + ICON.doc + '</span><span class="row-main"><span class="row-name">' + esc(g.n) +
      '</span><div class="row-sub">' + n + (n === 1 ? " note" : " notes") + "</div></span>" + ICON.chev + "</button>";
    const st = chapterStats(i), pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
    return '<button class="row chapter" type="button" data-s="' + i + '"><span class="row-main"><span class="row-name">' + esc(g.n) +
      '</span><span class="row-sub">' + st.total + (st.total === 1 ? " Lecture" : " Lectures") + (st.notes ? " | " + st.notes + (st.notes === 1 ? " Note" : " Notes") : "") + '</span>' +
      '<span class="ch-prog"><span class="ch-bar"><i style="width:' + pct + '%"></i></span><b>' + pct + "%</b></span></span>" + ICON.chev + "</button>";
  }

  function renderAbout() {
    const subj = batch.lectures.map((g) => g.n);
    const doneAll = allVids.reduce((n, f) => n + (isDone(f.idx) ? 1 : 0), 0);
    return '<div class="stats" style="grid-template-columns:repeat(4,1fr)"><div class="stat"><b>' + total(batch.lectures) + '</b><span>Lectures</span></div><div class="stat"><b>' + total(batch.notes) + '</b><span>Notes</span></div><div class="stat"><b id="lvAbDone">' + doneAll + '</b><span>Completed</span></div><div class="stat"><b>' + batch.lectures.length + '</b><span>Subjects</span></div></div>' +
      '<div class="about-card"><h3>About this batch</h3><p>' + esc(batch.about || "") + '</p></div>' +
      '<div class="about-card" style="margin-top:14px"><h3>Subjects</h3><div class="tags">' + subj.map((s) => '<span class="tag">' + esc(s) + "</span>").join("") + "</div></div>";
  }

  function renderItems(g) {
    const notes = state.tab === "notes";
    let h = '<p class="crumb">' + esc(batch.name) + " › " + (notes ? "Notes" : "Lectures") + " › " + esc(g.n) + "</p>";
    if (g.i.length > 10) h += '<input class="search" id="itemSearch" type="search" placeholder="Search in ' + esc(g.n) + '…" autocomplete="off" value="' + esc(filterText) + '">';
    if (!notes) {
      const st = chapterStats(state.s), pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
      h = h.replace('</p>', '</p><div class="lv-prog' + (st.total && st.done >= st.total ? " full" : "") + '" id="lvProg"><div class="lv-prog-top"><span id="lvProgTxt">' + st.done + "/" + st.total + ' lectures done</span><b id="lvProgPct">' + pct + '%</b></div><div class="lv-bar"><i id="lvProgFill" style="width:' + pct + '%"></i></div></div>');
    }
    h += '<div class="list" id="itemList"></div>';
    return h;
  }

  function bindItems(g) {
    const notes = state.tab === "notes";
    const list = $("#itemList");
    const draw = () => {
      const q = filterText.trim().toLowerCase();
      const rows = [];
      g.i.forEach((it, idx) => { if (!q || it[0].toLowerCase().includes(q)) rows.push([it, idx]); });
      curList = rows.map((r) => ({ it: r[0], idx: r[1] }));
      list.innerHTML = rows.length ? rows.map(([it, idx], n) => itemRow(it, idx, n, notes)).join("") : '<div class="empty">No results found.</div>';
      const openRow = (el, a) => {
        const n = +el.dataset.n;
        if (notes) { openNote(curList[n], a && a.dataset.act); return; }
        const fi = offsets[state.s] + curList[n].idx, f = flat[fi];
        if (f && f.pdf) window.open(f.it[1], "_blank", "noopener,noreferrer"); else openLecture(fi);
      };
      list.querySelectorAll("[data-n]").forEach((el) => {
        el.addEventListener("click", (e) => {
          const c = e.target.closest("[data-chk]");
          if (c) { e.stopPropagation(); const i = +c.dataset.chk; setDone(i, !isDone(i)); return; }
          openRow(el, e.target.closest("[data-act]"));
        });
        el.addEventListener("keydown", (e) => {
          if (e.target !== el) return;
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRow(el, null); }
        });
      });
    };
    const search = $("#itemSearch");
    if (search) search.addEventListener("input", () => { filterText = search.value; draw(); });
    draw();
  }

  function itemRow(it, idx, n, notes) {
    const fi = notes ? -1 : offsets[state.s] + idx;
    const done = !notes && isDone(fi);
    if (notes) return '<div class="row item" data-n="' + n + '" role="button" tabindex="0"><span class="ico pdf" style="width:42px;height:42px;border-radius:13px">' + ICON.doc + '</span><span class="row-main"><span class="row-name">' + esc(it[0]) + '</span></span><span class="act"><button class="pill-btn solid" data-act="view" type="button">View</button><button class="pill-btn" data-act="dl" type="button">Download</button></span></div>';
    return '<div class="row item' + (done ? " done" : "") + '" data-n="' + n + '" data-fi="' + fi + '" data-num="' + (idx + 1) + '" role="button" tabindex="0"><span class="num">' + (done ? "✓" : idx + 1) + '</span><span class="row-main"><span class="row-name">' + esc(it[0]) + '</span></span><span class="play">' + ICON.play + '</span><button class="lv-chk" type="button" data-chk="' + fi + '" aria-pressed="' + (done ? "true" : "false") + '" aria-label="' + (done ? "Mark as not complete" : "Mark as complete") + '">' + SV.tick + "</button></div>";
  }

  function openNote(entry, act) {
    const url = entry.it[1];
    if (act === "dl") { const a = document.createElement("a"); a.href = url; a.download = ""; a.target = "_blank"; a.rel = "noopener noreferrer"; document.body.appendChild(a); a.click(); a.remove(); toast("Download started"); }
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  /* ---------- lecture list + completion ---------- */
  const DONE_KEY = "cx-done";
  const RECENT_KEY = "codex-studys-recent-lectures";
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const readDone = () => { const m = lsGet(DONE_KEY, {}); return m && typeof m === "object" && !Array.isArray(m) ? m : {}; };
  let doneMap = readDone();
  const lkey = (idx) => batchId + "-" + idx;
  const isDone = (idx) => !!doneMap[lkey(idx)];
  const isPdf = (u) => /\.pdf(\?|#|$)/i.test(String(u || ""));
  let flat = [], offsets = [], allVids = [], vids = [], lite = [], noteFlat = [], doneCount = 0, curG = -1;
  let player = null, cur = -1;

  function buildFlat() {
    flat = []; offsets = [];
    batch.lectures.forEach((g, gi) => { offsets[gi] = flat.length; g.i.forEach((it, ii) => flat.push({ it, g: gi, i: ii, idx: flat.length, pdf: isPdf(it[1]) })); });
    allVids = flat.filter((f) => !f.pdf);
    vids = []; lite = []; noteFlat = []; curG = -1;
    countDone();
  }
  const notesGroupFor = (gi) => batch.notes.findIndex((n) => n.n === batch.lectures[gi].n);
  const chapterStats = (gi) => {
    let total = 0, done = 0;
    flat.forEach((f) => { if (f.g === gi && !f.pdf) { total++; if (isDone(f.idx)) done++; } });
    const ni = notesGroupFor(gi);
    return { total, done, notes: ni >= 0 ? batch.notes[ni].i.length : 0 };
  };
  // the lecture screen only ever shows the lectures (and notes) of the chapter being watched
  function setGroup(gi) {
    if (gi === curG) return;
    curG = gi;
    vids = allVids.filter((f) => f.g === gi);
    lite = vids.map((f) => ({ id: lkey(f.idx), idx: f.idx, title: f.it[0] }));
    const ni = notesGroupFor(gi);
    noteFlat = [];
    (ni >= 0 ? [ni] : batch.notes.map((_, i) => i)).forEach((i) => batch.notes[i].i.forEach((it) => noteFlat.push({ title: it[0], url: it[1], g: i })));
    countDone();
  }
  function countDone() { doneMap = readDone(); doneCount = vids.reduce((n, f) => n + (isDone(f.idx) ? 1 : 0), 0); }

  function setDone(idx, on) {
    const m = readDone(), k = lkey(idx);
    if (on) m[k] = 1; else delete m[k];
    doneMap = m;
    try { localStorage.setItem(DONE_KEY, JSON.stringify(m)); } catch (e) {}
    doneCount = vids.reduce((n, f) => n + (isDone(f.idx) ? 1 : 0), 0);
    // update every visible copy of this lecture in place (no re-render)
    document.querySelectorAll('[data-fi="' + idx + '"]').forEach((r) => {
      r.classList.toggle("done", !!on);
      const n = r.querySelector(".num"); if (n) n.textContent = on ? "✓" : r.dataset.num;
      const c = r.querySelector("[data-chk]"); if (c) { c.setAttribute("aria-pressed", on ? "true" : "false"); c.setAttribute("aria-label", on ? "Mark as not complete" : "Mark as complete"); }
    });
    updateProgressDom();
  }

  function updateProgressDom() {
    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    if (state.s !== null && state.tab === "lectures" && batch.lectures[state.s]) {
      const st = chapterStats(state.s), pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
      set("lvProgTxt", (el) => { el.textContent = st.done + "/" + st.total + " lectures done"; });
      set("lvProgPct", (el) => { el.textContent = pct + "%"; });
      set("lvProgFill", (el) => { el.style.width = pct + "%"; });
      set("lvProg", (el) => el.classList.toggle("full", st.total > 0 && st.done >= st.total));
    }
    set("lvAbDone", (el) => { el.textContent = String(allVids.reduce((n, f) => n + (isDone(f.idx) ? 1 : 0), 0)); });
  }

  function resumePos(fi) {
    const p = +lsGet("lp:pos:" + lkey(fi), 0) || 0;
    return p > 10 ? p : 0;
  }

  /* ---------- recently watched (lecture level) ---------- */
  function trackLecture(f) {
    try {
      const kind = f.it[2], src = f.it[1];
      const thumb = kind === "y" ? "https://i.ytimg.com/vi/" + encodeURIComponent(src) + "/hqdefault.jpg" : ((meta && meta.previewImage) || "assets/batch-" + batchId + ".webp");
      const arr = lsGet(RECENT_KEY, []).filter((x) => !(x && x.b === batchId && x.i === f.idx));
      arr.unshift({ b: batchId, i: f.idx, t: f.it[0], bn: batch.name, th: thumb, at: Date.now() });
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr.slice(0, 10)));
    } catch (e) {}
  }

  /* ---------- lecture screen ---------- */
  const SV = {
    tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };

  function showAlt(html) {
    if (player) { try { player.v.pause(); } catch (e) {} }
    $("#lvRoot").style.display = "none";
    const a = $("#lvAlt"); a.innerHTML = html; a.classList.add("show");
  }
  function hideAlt() {
    const a = $("#lvAlt"); a.classList.remove("show"); a.innerHTML = "";
    $("#lvRoot").style.display = "";
  }

  function lecData(pos, o) {
    const f = vids[pos], src = f.it[1], kind = f.it[2];
    return {
      id: lkey(f.idx), idx: f.idx, kind, title: f.it[0],
      videoUrl: kind === "y" ? "https://www.youtube.com/watch?v=" + src : src,
      downloadUrl: kind === "v" ? src : null,
      quality: {}, chapters: [],
      attachments: noteFlat.map((x) => ({ title: x.title, url: x.url })),
      course: { title: batch.name },
      lectures: lite,
      previousLecture: pos > 0 ? lite[pos - 1] : null,
      nextLecture: pos < vids.length - 1 ? lite[pos + 1] : null,
      startAt: o.startAt || 0, autoplay: o.autoplay !== false
    };
  }

  const playerOpts = {
    onBack: () => closeOverlay(false),
    onNavigate: (n) => { if (n) openLecture(n.idx, {}); },
    onSelectLecture: (l) => { if (l) openLecture(l.idx, {}); },
    onEnded: (d) => { if (d && d.idx != null) setDone(d.idx, true); }
  };

  function openLecture(fi, o) {
    o = o || {};
    const f0 = flat[fi]; if (!f0 || f0.pdf) return;
    setGroup(f0.g);
    const pos = vids.findIndex((f) => f.idx === fi); if (pos < 0) return;
    const ov = $("#lv");
    if (!ov.classList.contains("open")) {
      history.pushState(Object.assign({}, state, { p: 1 }), "");
      ov.classList.add("open"); document.body.style.overflow = "hidden";
    }
    playPos(pos, o);
  }

  let pFallback = null;
  // file-stream "watch" pages expose the raw file at /dl/<id>, so the app's own player can stream it
  const streamUrl = (u) => String(u).replace(/\/watch\/([^/?#]+)/, "/dl/$1");
  function showFrame(f, pos) {
    showAlt('<iframe src="' + esc(f.it[1]) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="no-referrer"></iframe>' +
      '<div class="lv-altbar"><button class="pill-btn" type="button" data-alt="prev"' + (pos > 0 ? "" : " disabled") + '>◀ Prev</button><a class="pill-btn" href="' + esc(f.it[1]) + '" target="_blank" rel="noopener noreferrer">Open in new tab</a><button class="pill-btn" type="button" data-alt="next"' + (pos < vids.length - 1 ? "" : " disabled") + ">Next ▶</button></div>");
  }

  function playPos(pos, o) {
    cur = pos;
    const f = vids[pos];
    trackLecture(f);
    const d = lecData(pos, o);
    if (d.kind === "p") { d.videoUrl = d.downloadUrl = streamUrl(f.it[1]); pFallback = { f, pos }; } else pFallback = null;
    hideAlt();
    if (!player) {
      player = new LecturePlayer($("#lvRoot"), d, playerOpts);
      // if a file-stream link can't be decoded by this browser, fall back to its own page in a frame
      player.v.addEventListener("error", () => {
        if (pFallback && vids[cur] === pFallback.f) { const fb = pFallback; pFallback = null; showFrame(fb.f, fb.pos); }
      });
      try { LecturePlayer.mediaSession(player, "assets/icon-192.png"); } catch (e) {}
    } else player.load(d);
  }

  function closeOverlay(fromPop) {
    const ov = $("#lv"); if (!ov.classList.contains("open")) return;
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    if (player) { try { player.v.pause(); player.save(); } catch (e) {} }
    hideAlt();
    ov.classList.remove("open"); document.body.style.overflow = "";
    if (!fromPop && history.state && history.state.p) history.back();
  }

  $("#lvAlt").addEventListener("click", (e) => {
    const b = e.target.closest("[data-alt]"); if (!b || b.disabled) return;
    if (b.dataset.alt === "prev" && cur > 0) openLecture(vids[cur - 1].idx, {});
    else if (b.dataset.alt === "next" && cur < vids.length - 1) openLecture(vids[cur + 1].idx, {});
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !$("#lv").classList.contains("open")) return;
    if (document.fullscreenElement || (player && player.menu)) return;
    closeOverlay(false);
  });
  window.addEventListener("storage", (e) => { if (e.key === DONE_KEY && batch) { countDone(); updateProgressDom(); } });

  init();
})();
