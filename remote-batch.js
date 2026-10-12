/* CODEX STUDYS — detail page for remote (API-backed) batches.
 * Reuses the existing batch.html shell, hero, rows and toast. Drill-down:
 * Subjects → Topics → Concepts → Content. Playback hands the viewer's browser the
 * link the API returns; there is no proxying, decrypting or downloading here. */
(function () {
  "use strict";
  const R = window.CXRemote;
  if (!R) return;
  const API = R.api;

  const I = {
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  };
  const LEVELS = ["Subjects", "Topics", "Concepts", "Content"];

  function mountDetail(ctx) {
    const { batchId, params, esc, toast } = ctx;
    const $ = (s) => document.querySelector(s);
    const courseId = batchId.slice(2);
    const users = R.userIndexesFor(courseId, params.get("u"));
    let userIdx = users[0];
    const m = R.metaFor(courseId);
    const meta = { name: m.n || "", previewImage: m.i || "", byName: m.b || "", source: m.src || "", expired: !!m.x };

    // path = [{id, name}] for subject, topic, concept; content is the 4th level
    let path = [];
    let token = 0; // ignores out-of-date responses after fast navigation

    const page = $("#page");
    document.title = "Batch — CODEX STUDYS";

    // own back handling (drop the static-batch listener)
    const oldBack = $("#backBtn");
    const back = oldBack.cloneNode(true);
    oldBack.replaceWith(back);
    back.addEventListener("click", () => {
      if (path.length) { history.back(); return; }
      if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) history.back();
      else location.href = "index.html#courses";
    });
    window.addEventListener("popstate", (e) => {
      path = (e.state && e.state.rpath) || [];
      show();
    });
    history.replaceState({ rpath: [] }, "");

    function push(next) {
      path = next;
      history.pushState({ rpath: path }, "");
      window.scrollTo(0, 0);
      show();
    }

    /* ----- shared bits ----- */
    function heroHtml() {
      const name = meta.name || "Course " + courseId;
      const img = meta.previewImage || "assets/codex-telegram.png";
      const exp = meta.expired ? '<span class="badge warn">Expired</span>' : "";
      return '<div class="hero"><img class="hero-img" src="' + esc(img) + '" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'assets/codex-telegram.png\'">' +
        '<div class="hero-body"><h2 class="hero-title">' + esc(name) + '</h2>' +
        (meta.byName ? '<p class="hero-sub">' + esc(meta.byName) + "</p>" : "") +
        '<div class="badges"><span class="badge accent">Course</span>' + exp + "</div></div></div>";
    }
    const skeleton = '<div class="list" aria-busy="true" aria-label="Loading"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
    const stateBox = (cls, title, text, btn) =>
      '<div class="rstate ' + cls + '" role="' + (cls === "err" ? "alert" : "status") + '"><b>' + esc(title) + "</b><p>" + esc(text) + "</p>" + (btn ? '<button class="pill-btn solid" id="rRetry" type="button">Try again</button>' : "") + "</div>";

    function crumb() {
      const parts = [meta.name || "Course " + courseId].concat(path.map((p) => p.name));
      return '<p class="crumb">' + parts.map(esc).join(" › ") + "</p>";
    }

    /* ----- one level ----- */
    async function show() {
      const my = ++token;
      const level = path.length; // 0 subjects … 3 content
      $("#topTitle").textContent = level ? path[level - 1].name : (meta.name || "Course " + courseId);
      page.innerHTML = (level === 0 ? heroHtml() : "") + crumb() + '<h3 class="rhead">' + LEVELS[level] + "</h3>" + skeleton;
      const body = () => page.querySelector(".list");
      try {
        const items = await fetchLevel(level);
        if (my !== token) return;
        if (!items.length) {
          const txt = level === 0
            ? "This batch is listed, but the provider is not returning any subjects for it right now. Check back later."
            : "Nothing has been published here yet.";
          page.querySelector(".list").outerHTML = stateBox("empty", level === 0 ? "Content unavailable for now" : "No " + LEVELS[level].toLowerCase() + " yet", txt, false);
          if (level === 0) markEmpty();
          return;
        }
        body().innerHTML = items.map((it, i) => row(it, i, level)).join("");
        body().querySelectorAll("[data-i]").forEach((el) => {
          const act = () => onPick(items[+el.dataset.i], level);
          el.addEventListener("click", act);
          el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
        });
      } catch (e) {
        if (my !== token) return;
        page.querySelector(".list").outerHTML = stateBox("err", "Couldn't load " + LEVELS[level].toLowerCase(), e.message || "Something went wrong.", true);
        $("#rRetry").addEventListener("click", show);
      }
    }

    async function fetchLevel(level) {
      if (level === 0) {
        // try the userIndex we know, then any other index that listed this course
        let lastErr;
        for (const u of users) {
          try { const r = await API.getSubjects(courseId, u); userIdx = u; return r.map(mapItem); } catch (e) { lastErr = e; }
        }
        throw lastErr;
      }
      const [s, t, c] = path;
      if (level === 1) return (await API.getTopics(courseId, s.id, userIdx)).map(mapItem);
      if (level === 2) return (await API.getConcepts(courseId, s.id, t.id, userIdx)).map(mapItem);
      return (await API.getContent(courseId, s.id, t.id, c.id, userIdx)).map(mapItem);
    }

    function mapItem(x, i) {
      return {
        id: x.id ?? x._id ?? "",
        name: R.nameOf(x, "Item " + (i + 1)),
        type: x.type || "",
        pdf: x.pdf_url || "",
        video: x.video_id || (x.pdf_url ? "" : (x.id ?? "")),
        raw: x
      };
    }

    function row(it, i, level) {
      if (level < 3) {
        return '<button class="row chapter" type="button" data-i="' + i + '"><span class="ico">' + I.folder + '</span><span class="row-main"><span class="row-name">' + esc(it.name) + "</span>" +
          (it.type ? '<span class="row-sub">' + esc(it.type) + "</span>" : "") + "</span>" + I.chev + "</button>";
      }
      const playable = !!(it.pdf || it.video);
      return '<div class="row item' + (playable ? "" : " off") + '" data-i="' + i + '" role="button" tabindex="' + (playable ? 0 : -1) + '" aria-disabled="' + !playable + '">' +
        '<span class="num">' + (i + 1) + '</span><span class="row-main"><span class="row-name">' + esc(it.name) + "</span>" +
        (playable ? "" : '<span class="row-sub">Not available</span>') + "</span>" +
        '<span class="play">' + (it.pdf ? I.doc : I.play) + "</span></div>";
    }

    function onPick(it, level) {
      if (level < 3) {
        if (it.id === "" || it.id === null) return toast("This item has no id, so it can't be opened.");
        return push(path.concat([{ id: it.id, name: it.name }]));
      }
      if (it.pdf) { window.open(it.pdf, "_blank", "noopener,noreferrer"); return; }
      if (it.video) return openPlayer(it);
      toast("This lesson isn't available right now.");
    }

    function markEmpty() {
      try {
        const k = "cx-remote-probe-v1", m = JSON.parse(localStorage.getItem(k) || "{}");
        m[courseId] = { s: "empty", t: Date.now(), n: 0 };
        localStorage.setItem(k, JSON.stringify(m));
      } catch (e) {}
    }

    /* ----- player: direct links only, no proxy / decrypt / download ----- */
    function openPlayer(it) {
      const old = document.getElementById("rPlayer");
      if (old) old.remove();
      const box = document.createElement("div");
      box.id = "rPlayer";
      box.className = "rplayer";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.innerHTML = '<div class="rp-card"><div class="rp-top"><span class="rp-title">' + esc(it.name) + '</span><button class="pill-btn" id="rpClose" type="button" aria-label="Close player">Close</button></div>' +
        '<div class="rp-stage"><video id="rpVideo" controls playsinline controlsList="nodownload"></video><div class="rp-msg" id="rpMsg"></div></div></div>';
      document.body.appendChild(box);
      const video = box.querySelector("#rpVideo"), msg = box.querySelector("#rpMsg");
      let hls = null, gone = false;
      const stop = () => { if (hls) { try { hls.destroy(); } catch (e) {} hls = null; } try { video.pause(); video.removeAttribute("src"); video.load(); } catch (e) {} };
      const close = () => { gone = true; stop(); box.remove(); document.removeEventListener("keydown", onKey); };
      const onKey = (e) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", onKey);
      box.querySelector("#rpClose").addEventListener("click", close);
      box.addEventListener("click", (e) => { if (e.target === box) close(); });

      const setMsg = (t, retry) => {
        msg.style.display = t ? "flex" : "none";
        msg.innerHTML = t ? "<span>" + esc(t) + "</span>" + (retry ? '<button class="pill-btn solid" id="rpRetry" type="button">Try again</button>' : "") : "";
        const b = msg.querySelector("#rpRetry"); if (b) b.addEventListener("click", start);
      };

      function tryUrls(urls, i) {
        if (gone) return;
        if (i >= urls.length) { stop(); return setMsg("This stream couldn't be played in the browser. It may need access that isn't available here.", true); }
        stop();
        const url = urls[i], next = () => tryUrls(urls, i + 1);
        if (/\.m3u8(\?|#|$)/i.test(url) && window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls();
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => { setMsg(""); video.play().catch(() => {}); });
          hls.on(window.Hls.Events.ERROR, (_, d) => { if (d && d.fatal) next(); });
          hls.loadSource(url); hls.attachMedia(video);
        } else {
          video.onerror = next;
          video.onloadedmetadata = () => { setMsg(""); video.play().catch(() => {}); };
          video.src = url;
        }
      }

      async function start() {
        setMsg("Loading lecture…");
        try {
          const links = await API.getVideoLinks(it.video, courseId, userIdx);
          if (gone) return;
          if (!links.length) return setMsg("No playable video link is available for this lecture yet.", false);
          const urls = [];
          links.forEach((l) => l.urls.forEach((u) => { if (/^https?:\/\//i.test(u) && !urls.includes(u)) urls.push(u); }));
          if (!urls.length) return setMsg("No playable video link is available for this lecture yet.", false);
          tryUrls(urls, 0);
        } catch (e) { if (!gone) setMsg(e.message || "Couldn't load this lecture.", true); }
      }
      start();
    }

    show();
  }

  window.CXRemote.mountDetail = mountDetail;
})();
