/* CODEX STUDYS — remote batch sources (Nextmate + LearnByAKP).
 * Lists come from the two source sites; lesson data comes from the shared API.
 * Nothing here downloads, decrypts, mirrors or proxies video/PDF files: we only
 * read the metadata the API returns and hand the viewer's browser the links. */
(function () {
  "use strict";

  const API = "https://rgvikproxy.vercel.app/api";
  // Each source tries its URLs in order. "/api/vikaram" is this site's own tiny server
  // function (api/vikaram.js) that reads the list server-side, so the browser never hits a
  // cross-origin (CORS) block; the direct URL stays as a fallback for hosts without functions.
  const SOURCES = [
    { key: "nextmate", label: "Nextmate", urls: [API + "/allcourses"] },
    { key: "learnbyakp", label: "LearnByAKP", urls: ["/api/vikaram", "https://learnbyakp.site/vikaram.json"] }
  ];
  const LIST_KEY = "cx-remote-list-v1:";
  const ID_RE = /^[A-Za-z0-9_]+$/;
  const PROBE_KEY = "cx-remote-probe-v1";
  const INDEX_KEY = "cx-remote-index-v1";
  const PROBE_TTL = 30 * 60 * 1000;
  const MEM_TTL = 5 * 60 * 1000;
  const memCache = new Map();

  /* ---------- fetch with timeout, one retry, friendly errors ---------- */
  function apiError(kind, message, status) {
    const e = new Error(message);
    e.kind = kind;
    if (status) e.status = status;
    return e;
  }

  async function fetchOnce(url, timeout) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
      if (!res.ok) throw apiError("http", "The server answered with " + res.status + (res.statusText ? " " + res.statusText : "") + ".", res.status);
      try { return await res.json(); } catch (e) { throw apiError("parse", "The server sent a response we could not read."); }
    } catch (e) {
      if (e.kind) throw e;
      if (e.name === "AbortError") throw apiError("timeout", "The server took too long to respond.");
      throw apiError("network", "Could not reach the server. Check your connection.");
    } finally { clearTimeout(timer); }
  }

  async function fetchJson(url, opts) {
    const o = Object.assign({ timeout: 15000, retries: 1, cache: true }, opts || {});
    const hit = o.cache && memCache.get(url);
    if (hit && Date.now() - hit.t < MEM_TTL) return hit.data;
    let lastErr;
    for (let attempt = 0; attempt <= o.retries; attempt++) {
      try {
        const data = await fetchOnce(url, o.timeout);
        if (o.cache) memCache.set(url, { data, t: Date.now() });
        return data;
      } catch (e) {
        lastErr = e;
        const retryable = e.kind === "network" || e.kind === "timeout" || (e.kind === "http" && e.status >= 500);
        if (!retryable) break;
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    throw lastErr;
  }

  /* ---------- response-shape helpers ---------- */
  // Returns an array, or throws. Only a real (possibly empty) array counts as "the list".
  function listFrom(data, keys) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      for (const k of keys.concat(["data", "result", "items"])) {
        if (Array.isArray(data[k])) return data[k];
      }
      if (data.success === false || data.error) throw apiError("api", String(data.message || data.error || "The API reported an error."));
    }
    throw apiError("shape", "The API returned data in an unexpected format.");
  }

  const nameOf = (x, fallback) => String((x && (x.name || x.title)) || fallback || "").trim();
  const normName = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  /* ---------- listing ---------- */
  function normalizeCourse(raw, src) {
    if (!raw || typeof raw !== "object") return null;
    const idRaw = raw.id ?? raw._id ?? raw.courseId ?? raw.course_id;
    if (idRaw === undefined || idRaw === null || !ID_RE.test(String(idRaw))) return null;
    const id = String(idRaw);
    const userIndex = Number(raw.userIndex ?? 0) || 0;
    const expiry = raw.expiry || "";
    const expired = expiry ? new Date(expiry) < new Date() : false;
    return {
      _id: "r-" + id,
      sourceId: id,
      name: nameOf(raw, "Course " + id),
      byName: String(raw.byName || raw.teacher || raw.by || "").trim(),
      language: String(raw.language || "").trim(),
      previewImage: String(raw.thumbnail || raw.previewImage || raw.image || "").trim(),
      category: "other",
      type: "REMOTE",
      remote: true,
      userIndex,
      sources: [{ key: src.key, label: src.label, userIndex }],
      expiry,
      expired,
      contentStatus: "unknown"
    };
  }

  // Tries each URL; if all fail, falls back to the last list that loaded successfully
  // on this device (so a temporary outage doesn't empty the page or show an error).
  async function fetchList(src) {
    let lastErr;
    for (let i = 0; i < src.urls.length; i++) {
      const last = i === src.urls.length - 1;
      try {
        const data = await fetchJson(src.urls[i], { retries: last ? 1 : 0, timeout: last ? 15000 : 10000 });
        const list = listFrom(data, ["courses", "batches"]);
        if (list.length) writeLs(LIST_KEY + src.key, { t: Date.now(), list });
        return { list, stale: false };
      } catch (e) { lastErr = e; }
    }
    const saved = readLs(LIST_KEY + src.key);
    if (saved && Array.isArray(saved.list) && saved.list.length) return { list: saved.list, stale: true };
    throw lastErr;
  }

  async function loadSource(src) {
    const got = await fetchList(src);
    const list = got.list;
    const out = [];
    let skipped = 0;
    list.forEach((raw) => { const c = normalizeCourse(raw, src); if (c) out.push(c); else skipped++; });
    return { items: out, skipped, stale: got.stale };
  }

  // Loads both lists independently; one failing never hides the other.
  async function loadAll() {
    const status = {};
    const results = await Promise.all(SOURCES.map(async (src) => {
      try {
        const r = await loadSource(src);
        status[src.key] = { ok: true, label: src.label, count: r.items.length, skipped: r.skipped };
        return r.items;
      } catch (e) {
        status[src.key] = { ok: false, label: src.label, error: e.message || "Failed to load." };
        return [];
      }
    }));
    // de-duplicate by the source course id; keep every (source, userIndex) pair that listed it
    const byId = new Map();
    results.forEach((items) => items.forEach((c) => {
      const prev = byId.get(c.sourceId);
      if (!prev) { byId.set(c.sourceId, c); return; }
      c.sources.forEach((s) => { if (!prev.sources.some((p) => p.key === s.key && p.userIndex === s.userIndex)) prev.sources.push(s); });
      if (!prev.previewImage && c.previewImage) prev.previewImage = c.previewImage;
      if (!prev.byName && c.byName) prev.byName = c.byName;
      if (!prev.language && c.language) prev.language = c.language;
      if (normName(prev.name) !== normName(c.name)) console.warn("[remote] id " + c.sourceId + " has different names across sources:", prev.name, "|", c.name);
    }));
    const batches = Array.from(byId.values());
    saveIndex(batches);
    return { batches, status, allFailed: SOURCES.every((s) => !status[s.key].ok) };
  }

  /* ---------- merge with the batches that already ship with the app ---------- */
  function sameBatch(local, remote) {
    const a = normName(local.name), b = normName(remote.name);
    if (a && a === b) return true;
    // source batch 297 is the same course as the bundled "Aditya Ranjan VOD 3.0"
    return remote.sourceId === "297" && /\bvod\b/.test(b) && /\baditya\b/.test(b) && /\baditya\b/.test(a) && /\bvod\b/.test(a);
  }

  // Never removes or alters a bundled batch's own content; only attaches the source id / userIndex.
  function mergeWithLocal(localBatches, remoteBatches) {
    const locals = localBatches.filter((b) => !b.remote);
    const extras = [];
    (remoteBatches || []).forEach((r) => {
      const hit = locals.find((l) => sameBatch(l, r));
      if (hit) {
        hit.sourceId = r.sourceId;
        hit.userIndex = r.userIndex;
        hit.sources = r.sources;
        hit.mergedRemote = true;
      } else extras.push(r);
    });
    const probes = readProbe();
    extras.forEach((r) => { const p = probes[r.sourceId]; if (p && Date.now() - p.t < PROBE_TTL) r.contentStatus = p.s; });
    return locals.concat(extras);
  }

  /* ---------- small persistent maps ---------- */
  function readLs(k) { try { const v = JSON.parse(localStorage.getItem(k) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  function writeLs(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  const readProbe = () => readLs(PROBE_KEY);
  function saveIndex(batches) {
    const idx = readLs(INDEX_KEY);
    batches.forEach((b) => {
      idx[b.sourceId] = { u: b.userIndex, s: b.sources.map((s) => s.userIndex), n: b.name, i: b.previewImage, b: b.byName, src: b.sources.map((s) => s.label).join(" · "), x: b.expired ? 1 : 0 };
    });
    writeLs(INDEX_KEY, idx);
  }
  const metaFor = (id) => readLs(INDEX_KEY)[id] || {};
  function userIndexesFor(id, hint) {
    const known = readLs(INDEX_KEY)[id];
    const list = [];
    if (hint !== undefined && hint !== null && hint !== "" && !isNaN(Number(hint))) list.push(Number(hint));
    if (known) [known.u].concat(known.s || []).forEach((u) => { if (typeof u === "number" && !list.includes(u)) list.push(u); });
    return list.length ? list : [0];
  }

  /* ---------- lesson API (same endpoints the source sites use) ---------- */
  const q = encodeURIComponent;
  const getSubjects = (c, u) => fetchJson(API + "/subjects?courseid=" + q(c) + "&user=" + q(u)).then((d) => listFrom(d, ["subjects"]));
  const getTopics = (c, s, u) => fetchJson(API + "/topics?courseid=" + q(c) + "&subjectid=" + q(s) + "&user=" + q(u)).then((d) => listFrom(d, ["topics"]));
  const getConcepts = (c, s, t, u) => fetchJson(API + "/concepts?courseid=" + q(c) + "&subjectid=" + q(s) + "&topicid=" + q(t) + "&user=" + q(u)).then((d) => listFrom(d, ["concepts"]));
  const getContent = (c, s, t, k, u) => fetchJson(API + "/content?courseid=" + q(c) + "&subjectid=" + q(s) + "&topicid=" + q(t) + "&conceptid=" + q(k) + "&user=" + q(u)).then((d) => listFrom(d, ["content", "contents", "lectures"]));
  async function getVideoLinks(videoId, courseId, u) {
    const d = await fetchJson(API + "/video?video_id=" + q(videoId) + "&course_id=" + q(courseId) + "&user=" + q(u), { cache: false });
    const links = (d && d.data && d.data.encrypted_links) || [];
    return links.map((l) => ({ quality: l.quality || "", urls: [l.path, l.backup_url, l.backup_url2].filter(Boolean) })).filter((l) => l.urls.length);
  }

  /* ---------- background "does this batch have anything?" probe ---------- */
  // Only an explicit empty subjects array marks a batch "empty". Errors leave it "unknown".
  async function probeOne(batch) {
    const users = batch.sources.map((s) => s.userIndex);
    let lastErr;
    for (const u of users.filter((x, i) => users.indexOf(x) === i)) {
      try {
        const subjects = await getSubjects(batch.sourceId, u);
        return { status: subjects.length ? "ok" : "empty", userIndex: u, count: subjects.length };
      } catch (e) { lastErr = e; }
    }
    return { status: "unknown", error: lastErr };
  }

  let probeRun = 0;
  function probe(batches, onUpdate, concurrency) {
    const run = ++probeRun;
    const store = readProbe();
    const queue = batches.filter((b) => b.remote && b.contentStatus === "unknown");
    let active = 0, changed = false, timer = null;
    const flush = () => { if (changed) { changed = false; writeLs(PROBE_KEY, store); if (onUpdate) onUpdate(); } };
    return new Promise((resolve) => {
      const next = () => {
        if (run !== probeRun) return resolve();
        if (!queue.length && !active) { flush(); return resolve(); }
        while (active < (concurrency || 3) && queue.length) {
          const b = queue.shift();
          active++;
          probeOne(b).then((r) => {
            if (r.status === "ok" || r.status === "empty") {
              b.contentStatus = r.status;
              store[b.sourceId] = { s: r.status, t: Date.now(), n: r.count };
              changed = true;
              clearTimeout(timer); timer = setTimeout(flush, 500);
            }
          }).finally(() => { active--; next(); });
        }
      };
      next();
    });
  }

  window.CXRemote = {
    API, SOURCES, fetchJson, loadAll, mergeWithLocal, probe, userIndexesFor, metaFor, nameOf, normName,
    api: { getSubjects, getTopics, getConcepts, getContent, getVideoLinks }
  };
})();
