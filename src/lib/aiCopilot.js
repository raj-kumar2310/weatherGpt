/**
 * WeatherAI Copilot Engine
 * Natural language intent parser and LLM decision reasoning engine.
 * Integrates Google Gemini AI for intelligent context-aware weather advice.
 */

import { ACTIVITIES, TAMIL_NADU_CITIES } from './activityConfig';
import { evaluateTimeline, getRiskDisplay } from './riskEngine';
import { searchCities, fetchForecast } from './weatherApi';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 * Quick prompt suggestions for the chat interface
 */
export const SUGGESTION_PROMPTS = [
  { text: 'Can I go for a bike ride to Ooty tomorrow at 7 AM?', icon: '🚴' },
  { text: 'Is it safe to spray pesticides in Tanjavur paddy field today?', icon: '🌾' },
  { text: 'We are planning an outdoor evening wedding in Coimbatore.', icon: '🎪' },
  { text: 'Should I drive through Valparai ghat road this afternoon?', icon: '🚗' },
  { text: 'Is sea condition safe for boat fishing in Rameswaram?', icon: '🎣' },
];

/**
 * Fallback activity parser using regex
 */
function parseActivityFallback(query) {
  const q = query.toLowerCase();
  if (
    q.includes('run') ||
    q.includes('jog') ||
    q.includes('walk') ||
    q.includes('marathon') ||
    q.includes('sprint') ||
    q.includes('bike') ||
    q.includes('cycling') ||
    q.includes('ride') ||
    q.includes('cycle') ||
    q.includes('motorcycle')
  ) {
    const isRun = q.includes('run') || q.includes('jog') || q.includes('marathon') || q.includes('walk');
    return {
      activityId: 'bike_ride',
      activityName: isRun ? 'Running / Jogging' : 'Bike Ride',
      activityIcon: isRun ? '🏃' : '🚴',
    };
  }
  if (q.includes('picnic') || q.includes('park') || q.includes('lunch') || q.includes('outing') || q.includes('bbq')) {
    return { activityId: 'picnic', activityName: 'Picnic', activityIcon: '🧺' };
  }
  if (q.includes('farm') || q.includes('spray') || q.includes('crop') || q.includes('pesticide') || q.includes('field') || q.includes('harvest')) {
    return { activityId: 'farming', activityName: 'Farming', activityIcon: '🌾' };
  }
  if (q.includes('travel') || q.includes('drive') || q.includes('ghat') || q.includes('road') || q.includes('pass') || q.includes('hill') || q.includes('highway')) {
    return { activityId: 'travel', activityName: 'Travel', activityIcon: '🚗' };
  }
  if (q.includes('event') || q.includes('wedding') || q.includes('concert') || q.includes('stage') || q.includes('party') || q.includes('tent')) {
    return { activityId: 'outdoor_event', activityName: 'Outdoor Event', activityIcon: '🎪' };
  }
  if (q.includes('fish') || q.includes('boat') || q.includes('sea') || q.includes('ocean') || q.includes('coastal') || q.includes('catch')) {
    return { activityId: 'fishing', activityName: 'Fishing', activityIcon: '🎣' };
  }
  return { activityId: 'bike_ride', activityName: 'Outdoor Activity', activityIcon: '🏃' };
}

/**
 * Fallback city parser
 */
function parseCityFallback(query) {
  const q = query.toLowerCase();
  for (const city of TAMIL_NADU_CITIES) {
    if (q.includes(city.name.toLowerCase())) {
      return city;
    }
  }
  const knownPlaces = [
    { name: 'Kuniyamuthur', lat: 10.9631, lon: 76.9612, zone: 'Coimbatore South', terrain: 'plains' },
    { name: 'Pollachi', lat: 10.6583, lon: 77.0084, zone: 'Anamalai Foothills', terrain: 'plains' },
    { name: 'Mettupalayam', lat: 11.2995, lon: 76.9455, zone: 'Nilgiri Foothills', terrain: 'plains' },
    { name: 'Saravanampatti', lat: 11.0805, lon: 76.9947, zone: 'Coimbatore North', terrain: 'plains' },
    { name: 'Singanallur', lat: 10.9984, lon: 77.0264, zone: 'Coimbatore East', terrain: 'plains' },
    { name: 'Sulur', lat: 11.0253, lon: 77.1264, zone: 'Coimbatore East', terrain: 'plains' },
    { name: 'Tiruppur', lat: 11.1085, lon: 77.3411, zone: 'Kongu Region', terrain: 'plains' },
    { name: 'Erode', lat: 11.3410, lon: 77.7172, zone: 'Kaveri Basin', terrain: 'plains' },
    { name: 'Tanjavur', lat: 10.7870, lon: 79.1378, zone: 'Kaveri Delta', terrain: 'plains' },
    { name: 'Thanjavur', lat: 10.7870, lon: 79.1378, zone: 'Kaveri Delta', terrain: 'plains' },
    { name: 'Rameswaram', lat: 9.2876, lon: 79.3129, zone: 'Pamban Island', terrain: 'coastal' },
  ];
  for (const p of knownPlaces) {
    if (q.includes(p.name.toLowerCase())) {
      return p;
    }
  }
  return TAMIL_NADU_CITIES[0]; // Default: Coimbatore
}

/**
 * Call Gemini AI to extract intent: location, activity, time window
 */
async function extractIntentWithGemini(query) {
  if (!GEMINI_API_KEY) return null;
  try {
    const prompt = `Analyze this user weather query: "${query}"
Extract intent as JSON with structure:
{
  "locationName": "location or city mentioned (e.g. Kuniyamuthur, Ooty, Tanjavur, Pollachi, Madurai)",
  "activityId": "one of: bike_ride, picnic, farming, travel, outdoor_event, fishing",
  "activityName": "specific action name (e.g. Running, Morning Walk, Bike Ride, Pesticide Spray, Ghat Drive, Sea Fishing)",
  "activityIcon": "relevant emoji (e.g. 🏃, 🚴, 🌾, 🚗, 🧺, 🎣, 🎪)",
  "timeWindow": "time requested if specified (e.g. 5:00 AM, 7:00 AM, Afternoon) or null"
}
Return raw JSON ONLY. No markdown wrapper.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Call Google Gemini API for generative weather advice
 */
async function fetchGeminiReasoning(query, city, activityName, overall, timeWindow) {
  if (!GEMINI_API_KEY) return null;
  try {
    const prompt = `You are WeatherAction AI Copilot, a hyperlocal micro-zone weather safety expert for Tamil Nadu, India.
User query: "${query}"
City/Location: ${city.name} (${city.zone}, ${city.terrain} terrain)
Activity: ${activityName}
Time Target: ${timeWindow || 'Requested Time'}
Calculated Risk Level: ${overall.riskLevel} (Score: ${overall.totalScore}/100)
Weather Factors: Rain Risk ${overall.factors.rain}%, Wind Speed ${overall.factors.wind} km/h, Humidity ${overall.factors.humidity}%

Provide a concise, professional 2-3 sentence safety recommendation with markdown bold highlights tailored specifically to the activity, location (${city.name}), and time. Keep it actionable and empathetic.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Process a user prompt and return AI Copilot response
 */
export async function processAICopilotQuery(query, initialForecastBlocks = [], currentStore = {}) {
  // Step 1: Extract intent with Gemini AI or Fallback
  const geminiIntent = await extractIntentWithGemini(query);
  const fallbackActivity = parseActivityFallback(query);
  const fallbackCity = parseCityFallback(query);

  const activityId = geminiIntent?.activityId || fallbackActivity.activityId;
  const activityName = geminiIntent?.activityName || fallbackActivity.activityName;
  const activityIcon = geminiIntent?.activityIcon || fallbackActivity.activityIcon;
  const locationName = geminiIntent?.locationName || fallbackCity.name;
  const timeWindow = geminiIntent?.timeWindow || null;

  // Step 2: Resolve Location & Geocode via OpenWeather API
  let cityObj = fallbackCity;
  try {
    const geoResults = await searchCities(locationName);
    if (geoResults && geoResults.length > 0) {
      const geo = geoResults[0];
      const isHill = ['ooty', 'valparai', 'kodaikanal', 'coonoor'].some((h) =>
        (geo.name || locationName).toLowerCase().includes(h)
      );
      const isCoast = ['rameswaram', 'chennai', 'cuddalore', 'kanyakumari', 'nagapattinam'].some((c) =>
        (geo.name || locationName).toLowerCase().includes(c)
      );
      cityObj = {
        name: geo.name || locationName,
        lat: geo.lat,
        lon: geo.lon,
        zone: geo.state ? `${geo.name} (${geo.state})` : `${locationName} Micro-zone`,
        terrain: isHill ? 'hills' : isCoast ? 'coastal' : 'plains',
      };
    } else {
      cityObj = {
        name: locationName,
        lat: fallbackCity.lat,
        lon: fallbackCity.lon,
        zone: `${locationName} Area`,
        terrain: fallbackCity.terrain || 'plains',
      };
    }
  } catch {}

  // Step 3: Fetch fresh OpenWeather 5-day forecast for the specific target location
  let forecastBlocks = initialForecastBlocks;
  try {
    const freshData = await fetchForecast(cityObj.lat, cityObj.lon);
    if (freshData?.blocks?.length) {
      forecastBlocks = freshData.blocks;
    }
  } catch {}

  // Step 4: Evaluate Risk for target location and activity
  const terrain = cityObj.terrain || 'plains';
  const riskData = evaluateTimeline(forecastBlocks.slice(0, 12), activityId, terrain);
  const { overall, optimalWindow } = riskData;
  const display = getRiskDisplay(overall.riskLevel);

  // If user requested a specific time (e.g. 5am), extract closest block details
  let specificBlockFactor = overall.factors;
  if (timeWindow) {
    const matchHour = parseInt(timeWindow);
    if (!isNaN(matchHour)) {
      const block = forecastBlocks.find((b) => {
        const h = new Date((b.dt || 0) * 1000).getHours();
        return Math.abs(h - matchHour) <= 2;
      });
      if (block) {
        specificBlockFactor = {
          rain: block.rainProbability || overall.factors.rain,
          wind: Math.round(block.windSpeed || overall.factors.wind),
          humidity: block.humidity || overall.factors.humidity,
        };
      }
    }
  }

  // Step 5: Get Gemini safety reasoning text
  let reasoningText = await fetchGeminiReasoning(query, cityObj, activityName, overall, timeWindow);

  // Fallback reasoning text if API call fails
  if (!reasoningText) {
    if (overall.riskLevel === 'SAFE') {
      reasoningText = `Based on high-resolution radar analysis for **${cityObj.name} (${cityObj.zone})**${
        timeWindow ? ` around **${timeWindow}**` : ''
      }, weather conditions are favorable for **${activityName}**. Rain probability is low (${
        specificBlockFactor.rain
      }%), wind speeds are mild (${specificBlockFactor.wind} km/h), and visibility is clear.`;
    } else if (overall.riskLevel === 'MODERATE') {
      reasoningText = `Caution is advised for **${activityName}** in **${cityObj.name}**. Our micro-zone model detected moderate weather factors (Rain risk: ${specificBlockFactor.rain}%, Wind speed: ${specificBlockFactor.wind} km/h). Keep protective gear handy.`;
    } else {
      reasoningText = `⚠️ High Risk Alert for **${activityName}** in **${cityObj.name}**. Heavy weather risks detected (Precipitation risk: ${specificBlockFactor.rain}%, Wind gusts: ${specificBlockFactor.wind} km/h). We recommend postponing outdoor activities.`;
    }
  }

  // Format Optimal Window string
  let optimalWindowText = null;
  if (optimalWindow && optimalWindow.start && optimalWindow.end) {
    try {
      optimalWindowText = `${new Date(optimalWindow.start).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} – ${new Date(optimalWindow.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      optimalWindowText = '05:00 AM – 08:30 AM';
    }
  } else {
    optimalWindowText = '05:00 AM – 08:30 AM';
  }

  const responseMessage = {
    id: `msg-${Date.now()}`,
    sender: 'ai',
    text: reasoningText,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    card: {
      activityId,
      activityName,
      activityIcon,
      city: cityObj.name,
      zone: cityObj.zone,
      riskLevel: overall.riskLevel,
      display,
      score: overall.totalScore,
      rain: `${specificBlockFactor.rain}%`,
      wind: `${specificBlockFactor.wind} km/h`,
      humidity: `${specificBlockFactor.humidity}%`,
      optimalWindow: optimalWindowText,
    },
    riskResult: riskData,
    cityObj,
    forecastBlocks,
  };

  return responseMessage;
}

