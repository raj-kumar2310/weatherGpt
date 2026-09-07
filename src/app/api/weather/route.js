import { NextResponse } from 'next/server';

const API_KEY = process.env.OWM_API_KEY || process.env.NEXT_PUBLIC_OWM_API_KEY;
const BASE_URL = 'https://api.openweathermap.org';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'current';
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const q = searchParams.get('q');

  if (!API_KEY) {
    return NextResponse.json({ error: 'OWM API key missing on server' }, { status: 500 });
  }

  try {
    let url = '';
    if (type === 'current' && lat && lon) {
      url = `${BASE_URL}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    } else if (type === 'forecast' && lat && lon) {
      url = `${BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=16&units=metric&appid=${API_KEY}`;
    } else if (type === 'air_pollution' && lat && lon) {
      url = `${BASE_URL}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    } else if (type === 'geo' && q) {
      url = `${BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(q)},IN&limit=5&appid=${API_KEY}`;
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `OWM error ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
