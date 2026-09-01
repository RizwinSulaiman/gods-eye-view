export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    const url = new URL('https://ll.thespacedevs.com/2.3.0/launches/');
    url.searchParams.set('net__gte', start.toISOString());
    url.searchParams.set('net__lte', end.toISOString());
    url.searchParams.set('limit', '100');
    url.searchParams.set('mode', 'detailed');
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await upstream.text();
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Launch feed unavailable' });
    const body = JSON.parse(text);
    if (!Array.isArray(body?.results)) throw new Error('Malformed launch feed');
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json(body);
  } catch {
    return res.status(502).json({ error: 'Launch feed unavailable' });
  }
}
