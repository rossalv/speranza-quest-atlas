// Cloudflare Worker for speranzaquestmap.us.
// Static files (dist-web/) are served by Cloudflare before this code runs; this Worker
// only sees requests that don't match a file. It adds one endpoint:
//
//   GET /api/conditions?region=north-america|europe
//
// Live map conditions (Frigate, Matriarch, Night Raid...) from MetaForge's public
// event schedule, trimmed to the next 24 hours and cached at Cloudflare's edge for a
// few minutes, so visitors never call MetaForge directly (MetaForge asks API users to
// cache). Nothing about the visitor is stored or forwarded.

const UPSTREAM = "https://metaforge.app/api/arc-raiders/events-schedule";
const REGIONS = new Set(["north-america", "europe"]);
const CACHE_SECONDS = 600;          // edge cache for the trimmed schedule
const WINDOW_MS = 24 * 3600 * 1000; // how far ahead to return
const MAP_NAMES = { Dam: "Dam Battlegrounds" }; // MetaForge name -> site name

export function normalize(raw, region, now) {
  const events = (Array.isArray(raw && raw.data) ? raw.data : [])
    .filter(e => e && typeof e.name === "string" && typeof e.map === "string"
      && Number.isFinite(e.startTime) && Number.isFinite(e.endTime)
      && e.endTime > now && e.startTime < now + WINDOW_MS)
    .map(e => ({ name: e.name, map: MAP_NAMES[e.map] || e.map, start: e.startTime, end: e.endTime }))
    .sort((a, b) => a.start - b.start || a.map.localeCompare(b.map));
  return { region, fetchedAt: now, source: "MetaForge", events };
}

function json(body, status, maxAge) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": maxAge ? `public, max-age=${maxAge}` : "no-store",
    },
  });
}

export async function conditions(request, ctx, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  const cache = deps.cache || caches.default;
  const now = deps.now ? deps.now() : Date.now();
  const url = new URL(request.url);
  const region = REGIONS.has(url.searchParams.get("region")) ? url.searchParams.get("region") : "north-america";

  // One cache entry per region, independent of any other query junk.
  const key = new Request(`${url.origin}/api/conditions?region=${region}`);
  const hit = await cache.match(key);
  if (hit) return hit;

  let raw;
  try {
    const res = await fetchImpl(`${UPSTREAM}?region=${region}`, {
      headers: { "user-agent": "speranzaquestmap.us (quest map; caches responses)" },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    raw = await res.json();
  } catch (err) {
    return json({ region, error: "Map conditions are unavailable right now." }, 502, 0);
  }

  const resp = json(normalize(raw, region, now), 200, CACHE_SECONDS);
  const put = cache.put(key, resp.clone());
  if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put;
  return resp;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/conditions") {
      if (request.method !== "GET") return json({ error: "GET only" }, 405, 0);
      return conditions(request, ctx);
    }
    // Anything else that isn't a file: let the static assets answer (their 404).
    return env.ASSETS.fetch(request);
  },
};
