import { normalizeRegionalPlace, normalizeRegionalWeather } from '../src/data/regionalBrief.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const latitude = Number(req.query?.latitude), longitude = Number(req.query?.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required' });
  }
  const weatherParams = new URLSearchParams({
    latitude: latitude.toFixed(5), longitude: longitude.toFixed(5),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility', timezone: 'UTC',
  });
  const placeParams = new URLSearchParams({ format: 'jsonv2', lat: latitude.toFixed(5), lon: longitude.toFixed(5), zoom: '10', addressdetails: '1', 'accept-language': 'en' });
  const [placeResult, weatherResult] = await Promise.allSettled([
    fetch(`https://nominatim.openstreetmap.org/reverse?${placeParams}`, { headers: { 'User-Agent': 'GodsEyeView/0.1 (+https://github.com/RizwinSulaiman/gods-eye-view)' } }).then(r => r.ok ? r.json() : null),
    fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`).then(r => r.ok ? r.json() : null),
  ]);
  const place = placeResult.status === 'fulfilled' ? normalizeRegionalPlace(placeResult.value) : null;
  const weather = weatherResult.status === 'fulfilled' ? normalizeRegionalWeather(weatherResult.value) : null;
  if (!place && !weather) return res.status(503).json({ error: 'Regional briefing is temporarily unavailable' });
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
  return res.status(200).json({ status: place && weather ? 'partial' : 'partial', retrievedAt: new Date().toISOString(), coordinates: { latitude, longitude }, place, placeStatus: place ? 'ready' : 'unavailable', weather, weatherStatus: weather ? 'ready' : 'unavailable', newsStatus: 'unavailable', newsQuery: null, newsSource: null, articles: [] });
}
