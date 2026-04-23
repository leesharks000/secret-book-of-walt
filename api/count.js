// /api/count.js
// Vercel Serverless Function — increments and returns visitor count
// Requires: Vercel KV store (free tier, enable from Vercel dashboard)
//
// Setup:
// 1. Go to your Vercel project dashboard
// 2. Storage tab → Create → KV (Redis) → name it "walt-counter"
// 3. It auto-adds the env vars (KV_REST_API_URL, KV_REST_API_TOKEN)
// 4. Deploy. Done.

export default async function handler(req, res) {
  // CORS headers for the frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    // Fallback if KV not configured yet — return a placeholder
    return res.status(200).json({ count: "—", configured: false });
  }

  try {
    if (req.method === "POST") {
      // Increment counter
      const resp = await fetch(`${KV_URL}/incr/walt_visitors`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const data = await resp.json();
      return res.status(200).json({ count: data.result });
    } else {
      // GET — just read current count
      const resp = await fetch(`${KV_URL}/get/walt_visitors`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const data = await resp.json();
      return res.status(200).json({ count: data.result || 0 });
    }
  } catch (err) {
    return res.status(200).json({ count: "—", error: true });
  }
}
