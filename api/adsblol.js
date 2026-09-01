export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const upstream = await fetch('https://api.adsb.lol/v2/mil', {
      headers: { Accept: 'application/json', 'User-Agent': 'gods-eye-view/0.1' },
    });
    const text = await upstream.text();
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Military aircraft feed unavailable' });
    const body = JSON.parse(text);
    if (!Array.isArray(body?.ac)) throw new Error('Malformed feed');
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return res.status(200).json(body);
  } catch {
    return res.status(502).json({ error: 'Military aircraft feed unavailable' });
  }
}
