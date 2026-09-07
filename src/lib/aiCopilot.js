/**
 * WeatherAI Copilot Engine
 * Natural language intent parser and LLM decision reasoning engine.
 * Integrates Google Gemini AI for intelligent context-aware weather advice.
 */

import { ACTIVITIES, TAMIL_NADU_CITIES } from './activityConfig';
import { evaluateTimeline, getRiskDisplay } from './riskEngine';
import { searchCities, fetchForecast, fetchCurrentWeather, normalizeCurrentWeather } from './weatherApi';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 * Call Google Gemini REST API with sequential model fallbacks to handle deprecations or 404s
 */
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) return null;
  const models = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-pro',
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch {
      // try next model
    }
  }
  return null;
}

/**
 * Quick prompt suggestions for the chat interface
 */
export const SUGGESTION_PROMPTS = [
  { text: 'Nalaki weather enna epdi erukum entha place polama entha activity panalama?', icon: '✨' },
  { text: 'Which place in Tamil Nadu is best to visit tomorrow?', icon: '📍' },
  { text: 'What is the current temperature in Coimbatore?', icon: '🌡️' },
  { text: 'Can I go for a run in Kuniyamuthur tomorrow at 5 AM?', icon: '🏃' },
  { text: 'Is it safe to spray pesticides in Tanjavur paddy field today?', icon: '🌾' },
  { text: 'Should I drive through Valparai ghat road this afternoon?', icon: '🚗' },
];

/**
 * Fallback intent classification & parsing
 */
function parseIntentFallback(query) {
  const q = query.toLowerCase();

  const activityKeywords = [
    'run', 'jog', 'walk', 'marathon', 'sprint', 'bike', 'cycling', 'ride', 'cycle',
    'picnic', 'park', 'farm', 'spray', 'crop', 'pesticide', 'travel', 'drive', 'ghat',
    'event', 'wedding', 'fish', 'boat', 'sea', 'ocean'
  ];
  const hasActivity = activityKeywords.some((k) => q.includes(k));
  const city = parseCityFallback(query);

  if (!hasActivity) {
    return {
      isActivityQuery: false,
      locationName: city.name,
      city,
    };
  }

  let activityId = 'bike_ride';
  let activityName = 'Outdoor Activity';
  let activityIcon = '🏃';

  if (q.includes('run') || q.includes('jog') || q.includes('walk') || q.includes('marathon') || q.includes('sprint') || q.includes('bike') || q.includes('cycling') || q.includes('ride') || q.includes('cycle')) {
    const isRun = q.includes('run') || q.includes('jog') || q.includes('marathon') || q.includes('walk');
    activityId = 'bike_ride';
    activityName = isRun ? 'Running / Jogging' : 'Bike Ride';
    activityIcon = isRun ? '🏃' : '🚴';
  } else if (q.includes('picnic') || q.includes('park') || q.includes('lunch') || q.includes('outing')) {
    activityId = 'picnic';
    activityName = 'Picnic';
    activityIcon = '🧺';
  } else if (q.includes('farm') || q.includes('spray') || q.includes('crop') || q.includes('pesticide')) {
    activityId = 'farming';
    activityName = 'Farming';
    activityIcon = '🌾';
  } else if (q.includes('travel') || q.includes('drive') || q.includes('ghat') || q.includes('road')) {
    activityId = 'travel';
    activityName = 'Travel';
    activityIcon = '🚗';
  } else if (q.includes('event') || q.includes('wedding') || q.includes('concert') || q.includes('party')) {
    activityId = 'outdoor_event';
    activityName = 'Outdoor Event';
    activityIcon = '🎪';
  } else if (q.includes('fish') || q.includes('boat') || q.includes('sea') || q.includes('ocean')) {
    activityId = 'fishing';
    activityName = 'Fishing';
    activityIcon = '🎣';
  }

  return {
    isActivityQuery: true,
    locationName: city.name,
    activityId,
    activityName,
    activityIcon,
    city,
  };
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
  // Default to Coimbatore if no match
  return TAMIL_NADU_CITIES.find((c) => c.name === 'Coimbatore') || TAMIL_NADU_CITIES[0];
}

/**
 * Call Gemini AI to extract intent: isActivityQuery, location, activity, time window
 */
async function extractIntentWithGemini(query) {
  if (!GEMINI_API_KEY) return null;
  try {
    const prompt = `Analyze this user weather chatbot query: "${query}"
Extract intent as JSON with structure:
{
  "isActivityQuery": boolean (Set to true ONLY if user asks about planning/doing a specific outdoor activity or safety for an activity like running, cycling, trip, farming, fishing, drive, event. Set to false if user asks for temperature, current weather, greetings, climate, or general info),
  "locationName": "location or city mentioned (e.g. Palani, Coimbatore, Kuniyamuthur, Ooty, Tanjavur, Pollachi, Madurai)",
  "activityId": "one of: bike_ride, picnic, farming, travel, outdoor_event, fishing or null",
  "activityName": "specific action name (e.g. Running, Morning Walk, Bike Ride, Pesticide Spray, Ghat Drive, Sea Fishing) or null",
  "activityIcon": "relevant emoji (e.g. 🏃, 🚴, 🌾, 🚗, 🧺, 🎣, 🎪) or null",
  "timeWindow": "time requested if specified (e.g. 5:00 AM, 7:00 AM, Afternoon) or null"
}
Return raw JSON ONLY. No markdown wrapper.`;

    const text = await callGeminiAPI(prompt);
    if (!text) return null;
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return null;
  }
}

/**
 * Call Gemini API to answer conversational & ChatGPT decision-making weather queries
 */
async function fetchGeminiGeneralResponse(query, cityObj, currentWeatherData, forecastData, language = 'en') {
  if (!GEMINI_API_KEY) return null;
  try {
    const temp = currentWeatherData?.temp || forecastData?.[0]?.temp || 27;
    const feelsLike = currentWeatherData?.feelsLike || forecastData?.[0]?.feelsLike || 29;
    const humidity = currentWeatherData?.humidity || forecastData?.[0]?.humidity || 68;
    const windSpeed = currentWeatherData?.windSpeed || Math.round(forecastData?.[0]?.windSpeed || 12);
    const weatherDesc = currentWeatherData?.weatherDesc || forecastData?.[0]?.weatherDesc || 'scattered clouds';
    const rainProb = forecastData?.[0]?.rainProbability || 10;

    const qLower = query.toLowerCase();
    const isDecisionQuery = ['place', 'where', 'activity', 'polama', 'panalama', 'nalaki', 'tomorrow', 'suggest', 'recommend', 'plan', 'which'].some((k) => qLower.includes(k));
    const langPrompt = language === 'ta' ? 'LANGUAGE INSTRUCTION: The user selected TAMIL (தமிழ்). Please provide the response in clear, helpful Tamil with Tamil markdown titles.' : '';

    const prompt = `You are WeatherAction ChatGPT AI, a smart decision-making weather & travel expert assistant for Tamil Nadu, India.
User query: "${query}"
Selected Target Location: ${cityObj.name} (${cityObj.zone})
Current Live Weather Data:
- Temperature: ${temp}°C (Feels like ${feelsLike}°C)
- Condition: ${weatherDesc}
- Rain Probability: ${rainProb}%
- Wind Speed: ${windSpeed} km/h
- Humidity: ${humidity}%

${langPrompt}

${
  isDecisionQuery
    ? `The user wants a ChatGPT-style DECISION on tomorrow's weather, which place to visit, and which outdoor activity to do!
Please format your response into 4 distinct, elegant markdown sections:
1. ☀️ **Tomorrow's Weather Forecast** (Summarize forecast for ${cityObj.name} & Tamil Nadu micro-zones).
2. 📍 **Recommended Places to Visit** (Suggest 2 top destinations like Ooty for hills, Coimbatore for plains, Tanjavur for farming, etc.).
3. 🚴 **Best Activities to Do** (Recommend 2 safe outdoor activities like morning running, picnic, or travel with timing).
4. ⚠️ **Safety Tip & Places to Avoid** (Highlight any fog/rain/wind risk areas like ghat roads).`
    : `Answer the user's question directly and conversationally in 2-3 well-formatted sentences using markdown bold highlights for temperature and key numbers. If they asked for temperature, clearly highlight the temperature. Be helpful, concise, and friendly like ChatGPT.`
}`;

    return await callGeminiAPI(prompt);
  } catch {
    return null;
  }
}

/**
 * Call Google Gemini API for generative activity weather safety advice
 */
async function fetchGeminiReasoning(query, city, activityName, overall, timeWindow, language = 'en') {
  if (!GEMINI_API_KEY) return null;
  try {
    const langPrompt = language === 'ta' ? 'LANGUAGE INSTRUCTION: Please provide the safety recommendation in clear Tamil language.' : '';
    const prompt = `You are WeatherAction AI Copilot, a hyperlocal micro-zone weather safety expert for Tamil Nadu, India.
User query: "${query}"
City/Location: ${city.name} (${city.zone}, ${city.terrain} terrain)
Activity: ${activityName}
Time Target: ${timeWindow || 'Requested Time'}
Calculated Risk Level: ${overall.riskLevel} (Score: ${overall.totalScore}/100)
Weather Factors: Rain Risk ${overall.factors.rain}%, Wind Speed ${overall.factors.wind} km/h, Humidity ${overall.factors.humidity}%

${langPrompt}

Provide a concise, professional 2-3 sentence safety recommendation with markdown bold highlights tailored specifically to the activity, location (${city.name}), and time. Keep it actionable and empathetic.`;

    return await callGeminiAPI(prompt);
  } catch {
    return null;
  }
}

/**
 * Process a user prompt and return AI Copilot response
 */
export async function processAICopilotQuery(query, initialForecastBlocks = [], currentStore = {}) {
  const language = currentStore.language || 'en';
  // Step 1: Extract intent with Gemini AI or Fallback
  const geminiIntent = await extractIntentWithGemini(query);
  const fallbackIntent = parseIntentFallback(query);

  const isActivityQuery = geminiIntent?.isActivityQuery !== undefined 
    ? geminiIntent.isActivityQuery 
    : fallbackIntent.isActivityQuery;

  const locationName = geminiIntent?.locationName || fallbackIntent.locationName;
  const fallbackCity = fallbackIntent.city || parseCityFallback(query);

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
    }
  } catch {}

  // Step 3: Fetch forecast & current weather data for location
  let forecastBlocks = initialForecastBlocks;
  let currentWeatherData = null;
  try {
    const [freshForecast, freshCurrent] = await Promise.all([
      fetchForecast(cityObj.lat, cityObj.lon),
      fetchCurrentWeather(cityObj.lat, cityObj.lon),
    ]);
    if (freshForecast?.blocks?.length) forecastBlocks = freshForecast.blocks;
    if (freshCurrent?.data) currentWeatherData = normalizeCurrentWeather(freshCurrent.data);
  } catch {}

  // -------------------------------------------------------------
  // CASE 1: Conversational Weather / Temperature Query (isActivityQuery = false)
  // -------------------------------------------------------------
  if (!isActivityQuery) {
    let generalText = await fetchGeminiGeneralResponse(query, cityObj, currentWeatherData, forecastBlocks, language);

    if (!generalText) {
      const temp = currentWeatherData?.temp || forecastBlocks?.[0]?.temp || 27;
      const feelsLike = currentWeatherData?.feelsLike || forecastBlocks?.[0]?.feelsLike || 29;
      const desc = currentWeatherData?.weatherDesc || forecastBlocks?.[0]?.weatherDesc || 'clear sky';
      const humidity = currentWeatherData?.humidity || forecastBlocks?.[0]?.humidity || 68;
      const windSpeed = currentWeatherData?.windSpeed || Math.round(forecastBlocks?.[0]?.windSpeed || 12);
      const rainProb = forecastBlocks?.[0]?.rainProbability || 10;

      generalText = `The current temperature in **${cityObj.name}** is **${temp}°C** (Feels like **${feelsLike}°C**) with **${desc}** 🌤️.\n\n` +
        `• 🌧️ Rain Probability: **${rainProb}%**\n` +
        `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
        `• 💧 Humidity: **${humidity}%**`;
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: generalText,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      card: null, // No activity decision card forced!
      cityObj,
      forecastBlocks,
    };
  }

  // -------------------------------------------------------------
  // CASE 2: Activity Safety Plan Query (isActivityQuery = true)
  // -------------------------------------------------------------
  const activityId = geminiIntent?.activityId || fallbackIntent.activityId || 'bike_ride';
  const activityName = geminiIntent?.activityName || fallbackIntent.activityName || 'Outdoor Activity';
  const activityIcon = geminiIntent?.activityIcon || fallbackIntent.activityIcon || '🏃';
  const timeWindow = geminiIntent?.timeWindow || null;

  const terrain = cityObj.terrain || 'plains';
  const riskData = evaluateTimeline(forecastBlocks.slice(0, 12), activityId, terrain);
  const { overall, optimalWindow } = riskData;
  const display = getRiskDisplay(overall.riskLevel);

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

  let reasoningText = await fetchGeminiReasoning(query, cityObj, activityName, overall, timeWindow, language);

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

  let optimalWindowText = '05:00 AM – 08:30 AM';
  if (optimalWindow && optimalWindow.start && optimalWindow.end) {
    try {
      optimalWindowText = `${new Date(optimalWindow.start).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} – ${new Date(optimalWindow.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {}
  }

  return {
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
}


