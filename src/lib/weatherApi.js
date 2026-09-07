/**
 * OpenWeatherMap API Client
 * Handles geocoding, current weather, and 5-day/3hr forecast.
 * Falls back to localStorage cache when API is unavailable.
 */

import { TAMIL_NADU_CITIES } from './activityConfig';

const API_KEY = process.env.NEXT_PUBLIC_OWM_API_KEY || 'demo';
const BASE_URL = 'https://api.openweathermap.org';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ------------- Mock data for demo/fallback -------------

const MOCK_CURRENT = {
  name: 'Coimbatore',
  sys: { country: 'IN', sunrise: 1691987400, sunset: 1692032400 },
  main: { temp: 27.4, feels_like: 30.2, humidity: 74, pressure: 1012 },
  weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
  wind: { speed: 4.2, deg: 220 },
  visibility: 8000,
  coord: { lat: 11.0168, lon: 76.9558 },
  dt: Math.floor(Date.now() / 1000),
  aqi: 82,
};

function buildMockForecast(base) {
  const blocks = [];
  const now = Math.floor(Date.now() / 1000);
  const rainPattern = [5, 8, 12, 25, 40, 62, 75, 68, 45, 30, 18, 10, 8, 5, 10, 15];
  const windPattern = [8, 10, 12, 15, 18, 22, 28, 25, 20, 16, 12, 10, 9, 8, 9, 11];
  const tempPattern = [24, 23, 24, 26, 28, 30, 31, 32, 31, 30, 28, 27, 26, 25, 24, 23];
  const uvPattern   = [0,  0,  1,  3,  5,  7,  8,  9,  8,  7,  5,  3,  1,  0,  0,  0];

  for (let i = 0; i < 16; i++) {
    blocks.push({
      dt: now + i * 3 * 3600,
      main: {
        temp: (base?.main?.temp || 28) + tempPattern[i] - 28,
        feels_like: (base?.main?.feels_like || 30) + tempPattern[i] - 28,
        humidity: 70 + Math.round(rainPattern[i] * 0.3),
        pressure: 1012,
      },
      weather: [
        rainPattern[i] > 50
          ? { id: 500, main: 'Rain', description: 'light rain', icon: '10d' }
          : rainPattern[i] > 25
          ? { id: 803, main: 'Clouds', description: 'broken clouds', icon: '04d' }
          : { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
      ],
      wind: { speed: windPattern[i] * (1000 / 3600), deg: 220 },
      visibility: rainPattern[i] > 60 ? 3000 : 9000,
      pop: rainPattern[i] / 100,
      rain: rainPattern[i] > 30 ? { '3h': rainPattern[i] * 0.05 } : undefined,
      uvIndex: uvPattern[i],
    });
  }
  return { list: blocks, city: { name: base?.name || 'Coimbatore', country: 'IN', sunrise: 1691987400, sunset: 1692032400 } };
}

// ------------- Cache helpers -------------

function readCache(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`owm_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return { data, age: Math.floor((Date.now() - ts) / 60000) };
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`owm_${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

function readStaleCache(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`owm_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return { data, age: Math.floor((Date.now() - ts) / 60000) };
  } catch {
    return null;
  }
}

// ------------- API helpers -------------

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ------------- Public API -------------

/**
 * Search cities by name (geocoding).
 * @returns {Promise<Array>} Array of { name, lat, lon, country, state }
 */
export async function searchCities(query) {
  if (!query || query.length < 2) return [];
  if (API_KEY === 'demo') {
    // Return Tamil Nadu cities matching the query
    return TAMIL_NADU_CITIES.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    ).map((c) => ({ name: c.name, lat: c.lat, lon: c.lon, country: 'IN', state: 'Tamil Nadu', zone: c.zone, terrain: c.terrain }));
  }
  const cacheKey = `geo_${query.toLowerCase()}`;
  const cached = readCache(cacheKey);
  if (cached) return cached.data;

  try {
    const data = await apiFetch(
      `${BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(query)},IN&limit=5&appid=${API_KEY}`
    );
    writeCache(cacheKey, data);
    return data;
  } catch {
    return [];
  }
}

/**
 * Fetch current weather for lat/lon.
 * @returns {Promise<{ data: Object, fromCache: boolean, cacheAge: number }>}
 */
export async function fetchCurrentWeather(lat, lon) {
  if (API_KEY === 'demo') {
    return { data: MOCK_CURRENT, fromCache: false, cacheAge: 0 };
  }

  const cacheKey = `current_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = readCache(cacheKey);
  if (cached) return { data: cached.data, fromCache: true, cacheAge: cached.age };

  try {
    const data = await apiFetch(
      `${BASE_URL}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    // Fetch AQI in parallel
    try {
      const aqiData = await apiFetch(
        `${BASE_URL}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      data.aqi = aqiData.list?.[0]?.main?.aqi * 20 || null;
    } catch { data.aqi = null; }

    writeCache(cacheKey, data);
    return { data, fromCache: false, cacheAge: 0 };
  } catch (err) {
    const stale = readStaleCache(cacheKey);
    if (stale) return { data: stale.data, fromCache: true, cacheAge: stale.age };
    return { data: MOCK_CURRENT, fromCache: true, cacheAge: 999 };
  }
}

/**
 * Fetch 5-day/3hr forecast for lat/lon and normalize it.
 * @returns {Promise<{ blocks: Array, fromCache: boolean, cacheAge: number }>}
 */
export async function fetchForecast(lat, lon) {
  if (API_KEY === 'demo') {
    const mock = buildMockForecast(MOCK_CURRENT);
    return { blocks: normalizeForecast(mock), fromCache: false, cacheAge: 0 };
  }

  const cacheKey = `forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = readCache(cacheKey);
  if (cached) {
    return { blocks: normalizeForecast(cached.data), fromCache: true, cacheAge: cached.age };
  }

  try {
    const data = await apiFetch(
      `${BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=16&units=metric&appid=${API_KEY}`
    );
    writeCache(cacheKey, data);
    return { blocks: normalizeForecast(data), fromCache: false, cacheAge: 0 };
  } catch {
    const stale = readStaleCache(cacheKey);
    if (stale) return { blocks: normalizeForecast(stale.data), fromCache: true, cacheAge: stale.age };
    const mock = buildMockForecast(MOCK_CURRENT);
    return { blocks: normalizeForecast(mock), fromCache: true, cacheAge: 999 };
  }
}

/**
 * Normalize raw OWM forecast list into a consistent shape for the risk engine.
 */
function normalizeForecast(raw) {
  if (!raw?.list) return [];
  return raw.list.map((item) => ({
    dt: item.dt,
    temp: item.main?.temp || 0,
    feelsLike: item.main?.feels_like || 0,
    humidity: item.main?.humidity || 0,
    pressure: item.main?.pressure || 1013,
    windSpeed: (item.wind?.speed || 0) * 3.6, // m/s → km/h
    windDeg: item.wind?.deg || 0,
    visibility: item.visibility || 10000,
    rainProbability: Math.round((item.pop || 0) * 100),
    rain3h: item.rain?.['3h'] || 0,
    weatherId: item.weather?.[0]?.id || 800,
    weatherMain: item.weather?.[0]?.main || 'Clear',
    weatherDesc: item.weather?.[0]?.description || 'clear sky',
    weatherIcon: item.weather?.[0]?.icon || '01d',
    uvIndex: item.uvIndex || estimateUV(item.dt, item.weather?.[0]?.id),
  }));
}

/**
 * Estimate UV index from time-of-day and weather condition when not in API response.
 */
function estimateUV(dt, weatherId) {
  const hour = new Date((dt || 0) * 1000).getHours();
  if (hour < 6 || hour > 18) return 0;
  const peakUV = weatherId >= 800 && weatherId < 900 ? 9 : weatherId < 700 ? 2 : 5;
  const timeFactor = 1 - Math.abs(hour - 12) / 6;
  return Math.round(peakUV * timeFactor * 10) / 10;
}

/**
 * Normalize raw OWM current weather into a consistent shape.
 */
export function normalizeCurrentWeather(raw) {
  if (!raw) return null;
  return {
    name: raw.name || 'Unknown',
    country: raw.sys?.country || 'IN',
    lat: raw.coord?.lat || 0,
    lon: raw.coord?.lon || 0,
    temp: Math.round(raw.main?.temp || 0),
    feelsLike: Math.round(raw.main?.feels_like || 0),
    humidity: raw.main?.humidity || 0,
    pressure: raw.main?.pressure || 1013,
    windSpeed: Math.round((raw.wind?.speed || 0) * 3.6), // m/s → km/h
    windDeg: raw.wind?.deg || 0,
    visibility: raw.visibility || 10000,
    weatherId: raw.weather?.[0]?.id || 800,
    weatherMain: raw.weather?.[0]?.main || 'Clear',
    weatherDesc: raw.weather?.[0]?.description || 'clear sky',
    weatherIcon: raw.weather?.[0]?.icon || '01d',
    aqi: raw.aqi || null,
    sunrise: raw.sys?.sunrise || 0,
    sunset: raw.sys?.sunset || 0,
    dt: raw.dt || Math.floor(Date.now() / 1000),
  };
}
