import { normalizeRegionalWeather } from '../src/data/regionalBrief.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const latitude = Number(req.query?.latitude);
  const longitude = Number(req.query?.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required' });
  }
  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(5), longitude: longitude.toFixed(5),
      current: 'temperature_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility',
      timezone: 'UTC',
    });
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!upstream.ok) throw new Error('weather upstream failed');
    const weather = normalizeRegionalWeather(await upstream.json());
    if (!weather) throw new Error('weather malformed');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
    return res.status(200).json({ status: 'ready', retrievedAt: new Date().toISOString(), coordinates: { latitude, longitude }, weather });
  } catch {
    return res.status(503).json({ error: 'Weather effects are temporarily unavailable' });
  }
}
