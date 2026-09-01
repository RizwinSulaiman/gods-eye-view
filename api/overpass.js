const UPSTREAMS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

function queryFromRequest(req) {
  if (typeof req.body === 'string') return new URLSearchParams(req.body).get('data') || req.body;
  if (Buffer.isBuffer(req.body)) return new URLSearchParams(req.body.toString('utf8')).get('data');
  if (req.body && typeof req.body === 'object') return String(req.body.data || '');
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const query = queryFromRequest(req);
  if (!query || query.length > 180000) return res.status(400).json({ error: 'Invalid Overpass query' });
  for (const endpoint of UPSTREAMS) {
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'User-Agent': 'gods-eye-view/0.1' },
        body: new URLSearchParams({ data: query }).toString(),
        signal: AbortSignal.timeout(22000),
      });
      const text = await upstream.text();
      if (!upstream.ok || !text.trim()) continue;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).send(text);
    } catch {}
  }
  return res.status(502).json({ error: 'Overpass proxy error' });
}
