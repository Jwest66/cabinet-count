// Cabinet Count picture relay (Cloudflare Worker)
//
// Looks up a product's photo on Kroger by barcode, so the app can fill in pictures
// that Open Food Facts doesn't have. It keeps your Kroger keys out of the public app.
//
// Set these in Cloudflare (your Worker → Settings → Variables and Secrets):
//   KROGER_CLIENT_ID      (type: Text)
//   KROGER_CLIENT_SECRET  (type: Secret)
//
// Use:  https://<your-worker>.workers.dev/?upc=049000006346
// Add &debug=1 to see what Kroger sent back if a lookup isn't working.

const ALLOWED_ORIGINS = ["https://jwest66.github.io", "http://localhost:8765"];
const KROGER = "https://api.kroger.com/v1";

let token = null;
let tokenExpires = 0;

async function getToken(env) {
  if (token && Date.now() < tokenExpires - 60000) return token;
  const res = await fetch(KROGER + "/connect/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(env.KROGER_CLIENT_ID + ":" + env.KROGER_CLIENT_SECRET)
    },
    body: "grant_type=client_credentials&scope=product.compact"
  });
  if (!res.ok) throw new Error("Kroger sign-in failed (" + res.status + "): check the client ID and secret");
  const j = await res.json();
  token = j.access_token;
  tokenExpires = Date.now() + (j.expires_in || 1800) * 1000;
  return token;
}

// Kroger product IDs are the UPC without its check digit, padded to 13 digits.
// Try that first, then the full code padded, in case the format differs.
function productIds(code) {
  const pad = c => c.padStart(13, "0");
  const ids = [];
  if (/^\d{12,13}$/.test(code)) ids.push(pad(code.slice(0, -1)));
  if (/^\d{8,13}$/.test(code)) ids.push(pad(code));
  return [...new Set(ids)];
}

function pickImage(p) {
  const imgs = p.images || [];
  const im = imgs.find(i => i.featured) || imgs.find(i => i.perspective === "front") || imgs[0];
  if (!im) return "";
  for (const size of ["medium", "large", "small", "xlarge", "thumbnail"]) {
    const hit = (im.sizes || []).find(x => x.size === size && x.url);
    if (hit) return hit.url;
  }
  return "";
}

function cleanName(p) {
  return String(p.description || "").replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
}

async function krogerGet(path, t) {
  const r = await fetch(KROGER + path, { headers: { Authorization: "Bearer " + t, Accept: "application/json" } });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: r.status, json, text: text.slice(0, 500) };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      Vary: "Origin"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET" } });
    }

    const url = new URL(request.url);
    const upc = (url.searchParams.get("upc") || "").replace(/\D/g, "");
    const debug = url.searchParams.has("debug");
    if (!/^\d{8,14}$/.test(upc)) {
      return Response.json({ error: "Add ?upc= followed by the barcode digits (8 to 14 digits)." }, { status: 400, headers: cors });
    }

    const cacheKey = new Request("https://cache.local/kroger/v1/" + upc);
    if (!debug) {
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        const res = new Response(cached.body, cached);
        Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
    }

    let body = {};
    const trace = [];
    try {
      const t = await getToken(env);
      const ids = productIds(upc);
      let product = null;

      // One search request covering every candidate ID.
      const search = await krogerGet("/products?filter.productId=" + ids.join(","), t);
      trace.push({ step: "search", ids, status: search.status, sample: debug ? search.text : undefined });
      if (search.status === 200 && search.json && Array.isArray(search.json.data)) product = search.json.data[0] || null;

      // Fall back to fetching each ID directly.
      for (const id of ids) {
        if (product) break;
        const one = await krogerGet("/products/" + id, t);
        trace.push({ step: "get", id, status: one.status, sample: debug ? one.text : undefined });
        if (one.status === 200 && one.json && one.json.data) product = one.json.data;
      }

      body = product ? { name: cleanName(product), image: pickImage(product), productId: product.productId } : {};
    } catch (e) {
      body = { error: String((e && e.message) || e) };
    }
    if (debug) body.trace = trace;

    const res = Response.json(body, { headers: { ...cors, "Cache-Control": "public, max-age=86400" } });
    if (!body.error && !debug) ctx.waitUntil(caches.default.put(cacheKey, res.clone()));
    return res;
  }
};
