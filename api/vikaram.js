// Vercel serverless function: GET /api/vikaram
// Reads the course list on the server (no browser CORS limits) and passes it on unchanged.
// It only ever requests this one fixed URL, so it cannot be used as an open proxy.
const SOURCE = "https://learnbyakp.site/vikaram.json";

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  try {
    const upstream = await fetch(SOURCE, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) throw new Error("Upstream answered " + upstream.status);
    const text = await upstream.text();
    JSON.parse(text); // make sure it really is JSON before passing it on
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).send(text);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ success: false, error: "Could not load the list right now." });
  }
};
