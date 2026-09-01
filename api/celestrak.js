export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  const group = String(req.query?.group || '').trim();
  if (!/^[a-z0-9-]+$/i.test(group)) return res.status(400).send('invalid group');
  try {
    const url = new URL('https://celestrak.org/NORAD/elements/gp.php');
    url.searchParams.set('GROUP', group);
    url.searchParams.set('FORMAT', 'tle');
    const upstream = await fetch(url, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'gods-eye-view/0.1 (+https://github.com/RizwinSulaiman/gods-eye-view)',
      },
    });
    const text = await upstream.text();
    if (!upstream.ok || !/^1 /m.test(text)) throw new Error('bad TLE response');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).send(text);
  } catch {
    return res.status(502).send('celestrak unavailable');
  }
}
