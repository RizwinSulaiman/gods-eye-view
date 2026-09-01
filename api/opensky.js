import { normalizeAdsbLolPointResponse } from '../src/data/adsbLolFallback.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const lat = Number(req.query?.lat);
  const lon = Number(req.query?.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'lat/lon required' });
  }
  try {
    const aLat = Math.round(lat * 4) / 4;
    const aLon = Math.round(lon * 4) / 4;
    const upstream = await fetch(`https://api.adsb.lol/v2/lat/${aLat}/lon/${aLon}/dist/250`, {
      headers: { Accept: 'application/json', 'User-Agent': 'gods-eye-view/0.1' },
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Aircraft feed unavailable' });
    const body = normalizeAdsbLolPointResponse(await upstream.json());
    res.setHeader('X-Flight-Source', 'adsb.lol');
    res.setHeader('X-Flight-Coverage', '250nm regional free feed');
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return res.status(200).json(body);
  } catch {
    return res.status(502).json({ error: 'Aircraft feed unavailable' });
  }
}
