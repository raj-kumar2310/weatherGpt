/**
 * WeatherAI Copilot Engine
 * Natural language intent parser and LLM decision reasoning engine.
 * Integrates Google Gemini AI for intelligent context-aware weather advice.
 */

import { ACTIVITIES, TAMIL_NADU_CITIES, matchCity } from './activityConfig';
import { evaluateTimeline, getRiskDisplay } from './riskEngine';
import { searchCities, fetchForecast, fetchCurrentWeather, normalizeCurrentWeather } from './weatherApi';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 * Call Next.js Server API route /api/copilot to interact with Google Gemini AI securely
 */
async function callGeminiAPI(prompt) {
  try {
    const res = await fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    }
  } catch {
    // fallback if server route unavailable
  }
  return null;
}


/**
 * Quick prompt suggestions for the chat interface
 */
export const SUGGESTION_PROMPTS = [
  { text: 'Nalaki namakal aha rain chance eruka?', icon: '🌧️' },
  { text: 'Nalaki weather enna epdi erukum entha place polama entha activity panalama?', icon: '✨' },
  { text: 'Which place in Tamil Nadu is best to visit tomorrow?', icon: '📍' },
  { text: 'What is the current temperature in Coimbatore?', icon: '🌡️' },
  { text: 'Can I go for a run in Kuniyamuthur tomorrow at 5 AM?', icon: '🏃' },
  { text: 'Is it safe to spray pesticides in Tanjavur paddy field today?', icon: '🌾' },
];

/**
 * Fallback intent classification & parsing
 */
function parseIntentFallback(query) {
  const q = query.toLowerCase();

  const isTomorrow = ['nalaki', 'naalaki', 'naalai', 'nalaiku', 'tomorrow', 'next day', 'nalai'].some((k) => q.includes(k));
  const isRainQuery = ['rain', 'mazhai', 'mazai', 'rainu', 'chance'].some((k) => q.includes(k));

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
      isTomorrow,
      isRainQuery,
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
    isTomorrow,
    isRainQuery,
  };
}

/**
 * Fallback city parser with Tanglish alias support
 */
function parseCityFallback(query) {
  const matched = matchCity(query);
  if (matched) return matched;
  // Default to Coimbatore if no match
  return TAMIL_NADU_CITIES.find((c) => c.name === 'Coimbatore') || TAMIL_NADU_CITIES[0];
}

/**
 * Call Gemini AI to extract intent: isActivityQuery, location, activity, time window, date target
 */
async function extractIntentWithGemini(query) {
  if (!GEMINI_API_KEY) return null;
  try {
    const prompt = `Analyze this user weather chatbot query: "${query}"
Extract intent as JSON with structure:
{
  "isActivityQuery": boolean (Set to true ONLY if user asks about planning/doing a specific outdoor activity or safety for an activity like running, cycling, trip, farming, fishing, drive, event. Set to false if user asks for temperature, current weather, rain chance, greetings, climate, or general info),
  "locationName": "location or city mentioned (e.g. Namakkal, Palani, Coimbatore, Kuniyamuthur, Ooty, Tanjavur, Pollachi, Madurai)",
  "isTomorrow": boolean (Set to true if user asks about tomorrow / nalaki / nalai / future day, false if today / iniku / current),
  "isRainQuery": boolean (Set to true if user asks specifically about rain / rain chance / mazhai),
  "activityId": "one of: bike_ride, picnic, farming, travel, outdoor_event, fishing or null",
  "activityName": "specific action name or null",
  "activityIcon": "relevant emoji or null",
  "timeWindow": "time requested if specified or null"
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
async function fetchGeminiGeneralResponse(query, cityObj, currentWeatherData, forecastData, isTomorrow, isRainQuery, language = 'en') {
  if (!GEMINI_API_KEY) return null;
  try {
    let targetBlock = forecastData?.[0] || {};
    if (isTomorrow && forecastData?.length >= 4) {
      const tomorrowBlocks = forecastData.slice(4, 12);
      if (tomorrowBlocks.length > 0) {
        targetBlock = tomorrowBlocks.reduce((max, b) => (b.rainProbability > max.rainProbability ? b : max), tomorrowBlocks[0]);
      }
    }

    const temp = targetBlock.temp || currentWeatherData?.temp || 27;
    const feelsLike = targetBlock.feelsLike || currentWeatherData?.feelsLike || 29;
    const humidity = targetBlock.humidity || currentWeatherData?.humidity || 68;
    const windSpeed = Math.round(targetBlock.windSpeed || currentWeatherData?.windSpeed || 12);
    const weatherDesc = targetBlock.weatherDesc || currentWeatherData?.weatherDesc || 'scattered clouds';
    const rainProb = targetBlock.rainProbability ?? currentWeatherData?.rainProbability ?? 10;

    const qLower = query.toLowerCase();
    const isDecisionQuery = ['place', 'where', 'activity', 'polama', 'panalama', 'suggest', 'recommend', 'plan', 'which'].some((k) => qLower.includes(k));
    const langPrompt = language === 'ta' ? 'LANGUAGE INSTRUCTION: The user selected TAMIL (தமிழ்). Please provide the response in clear, helpful Tamil.' : '';

    const prompt = `You are WeatherAction ChatGPT AI, a smart decision-making weather assistant for Tamil Nadu, India.
User query: "${query}"
Selected Target Location: ${cityObj.name} (${cityObj.zone})
Day Requested: ${isTomorrow ? 'TOMORROW (Nalaki)' : 'Today'}
Query Focus: ${isRainQuery ? 'Rain Probability / Rain Chance' : 'General Weather'}

Weather Data for ${cityObj.name} (${isTomorrow ? 'Tomorrow' : 'Current'}):
- Rain Probability: ${rainProb}%
- Temperature: ${temp}°C (Feels like ${feelsLike}°C)
- Condition: ${weatherDesc}
- Wind Speed: ${windSpeed} km/h
- Humidity: ${humidity}%

${langPrompt}

${
  isDecisionQuery
    ? `The user wants a ChatGPT-style DECISION on tomorrow's weather, which place to visit, and which outdoor activity to do!
Please format your response into 4 distinct markdown sections:
1. ☀️ **Tomorrow's Weather Forecast** (Summarize forecast for ${cityObj.name}).
2. 📍 **Recommended Places to Visit**
3. 🚴 **Best Activities to Do**
4. ⚠️ **Safety Tip & Places to Avoid**`
    : `Answer the user's question directly and conversationally in 2-3 sentences using markdown bold highlights. Explicitly state the rain probability (${rainProb}%) and weather for ${cityObj.name} ${isTomorrow ? 'tomorrow' : 'today'}.`
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
    const langPrompt = language === 'ta' ? 'LANGUAGE INSTRUCTION: Please provide the safety recommendation in clear, natural conversational Tamil language.' : '';
    const prompt = `You are WeatherAction Assistant, a smart decision-making weather assistant for Tamil Nadu, India.
User query: "${query}"
City/Location: ${city.name} (${city.zone}, ${city.terrain} terrain)
Activity/Topic: ${activityName}
Time Target: ${timeWindow || 'Requested Time'}
Calculated Risk Level: ${overall.riskLevel} (Score: ${overall.totalScore}/100)
Weather Factors: Rain Risk ${overall.factors.rain}%, Wind Speed ${overall.factors.wind} km/h, Humidity ${overall.factors.humidity}%

${langPrompt}

Please answer the user's question directly and conversationally like ChatGPT:
1. Provide a warm, direct 2-3 sentence answer specifically addressing their question (e.g. recommending 2-3 specific popular local places in ${city.name} like VOC Park or Singanallur Lake if they asked for places/picnic, or giving direct vehicle safety advice if they asked about travel).
2. Explicitly state the weather forecast (temperature, rain probability %, wind speed).
3. Use markdown bold highlights for key places, numbers, and times. Keep it friendly, empathetic, and natural.`;

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

  const isTomorrow = geminiIntent?.isTomorrow !== undefined
    ? geminiIntent.isTomorrow
    : fallbackIntent.isTomorrow;

  const isRainQuery = geminiIntent?.isRainQuery !== undefined
    ? geminiIntent.isRainQuery
    : fallbackIntent.isRainQuery;

  const locationName = geminiIntent?.locationName || fallbackIntent.locationName;
  const fallbackCity = matchCity(query) || fallbackIntent.city || parseCityFallback(query);

  // Step 2: Resolve Location & Geocode via OpenWeather API
  let cityObj = fallbackCity;
  try {
    const matchedLocal = matchCity(locationName || query);
    if (matchedLocal) {
      cityObj = matchedLocal;
    } else {
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
    let generalText = await fetchGeminiGeneralResponse(query, cityObj, currentWeatherData, forecastBlocks, isTomorrow, isRainQuery, language);

    if (!generalText) {
      let targetBlock = forecastBlocks[0] || {};
      if (isTomorrow && forecastBlocks.length >= 4) {
        const tomorrowBlocks = forecastBlocks.slice(4, 12);
        if (tomorrowBlocks.length > 0) {
          targetBlock = tomorrowBlocks.reduce((max, b) => (b.rainProbability > max.rainProbability ? b : max), tomorrowBlocks[0]);
        }
      }

      const temp = targetBlock.temp || currentWeatherData?.temp || 27;
      const feelsLike = targetBlock.feelsLike || currentWeatherData?.feelsLike || 29;
      const desc = targetBlock.weatherDesc || currentWeatherData?.weatherDesc || 'clear sky';
      const humidity = targetBlock.humidity || currentWeatherData?.humidity || 68;
      const windSpeed = Math.round(targetBlock.windSpeed || currentWeatherData?.windSpeed || 12);
      const rainProb = targetBlock.rainProbability ?? currentWeatherData?.rainProbability ?? 10;
      const timeLabel = isTomorrow ? 'Tomorrow' : 'Currently';

      if (rainProb === 0) {
        generalText = `Good news! **No rain expected** in **${cityObj.name}** ${isTomorrow ? 'tomorrow' : 'today'} (**0% rain probability**). Weather will be pleasant with **${desc}** (${temp}°C) 🌤️.\n\n` +
          `• 🌧️ Rain Chance: **0%** (No umbrella needed!)\n` +
          `• 🌡️ Temperature: **${temp}°C** (Feels like **${feelsLike}°C**)\n` +
          `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
          `• 💧 Humidity: **${humidity}%**`;
      } else if (rainProb < 40) {
        generalText = `There is a **low chance of rain (${rainProb}%)** in **${cityObj.name}** ${isTomorrow ? 'tomorrow' : 'today'}. Weather will be mostly pleasant with **${desc}** (${temp}°C) 🌤️.\n\n` +
          `• 🌧️ Rain Chance: **${rainProb}%**\n` +
          `• 🌡️ Temperature: **${temp}°C** (Feels like **${feelsLike}°C**)\n` +
          `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
          `• 💧 Humidity: **${humidity}%**`;
      } else {
        generalText = `Yes! **Rain is expected (${rainProb}% probability)** in **${cityObj.name}** ${isTomorrow ? 'tomorrow' : 'today'}. Please carry an umbrella or raincoat! ☔\n\n` +
          `• 🌧️ Rain Chance: **${rainProb}%**\n` +
          `• 🌡️ Temperature: **${temp}°C** (Feels like **${feelsLike}°C**)\n` +
          `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
          `• 💧 Humidity: **${humidity}%**`;
      }
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

  let optimalWindowText = '05:30 AM – 08:30 AM';
  if (optimalWindow && optimalWindow.start && optimalWindow.end) {
    try {
      optimalWindowText = `${new Date(optimalWindow.start).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} – ${new Date(optimalWindow.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {}
  }

  if (!reasoningText) {
    const temp = forecastBlocks[0]?.temp ? Math.round(forecastBlocks[0].temp) : 26;
    if (activityId === 'picnic') {
      reasoningText = `For a **Picnic in ${cityObj.name}** based on current weather (${temp}°C, rain chance ${specificBlockFactor.rain}%):\n\n` +
        `• 🌿 **Recommended Places**: **VOC Park & Botanical Garden**, **Singanallur Lake**, or **Siruvani Foothills**.\n` +
        `• ⛅ **Weather Assessment**: ${overall.riskLevel === 'SAFE' ? 'Favorable conditions with low rain risk!' : `Rain chance is low (${specificBlockFactor.rain}%) with breezy winds at ${specificBlockFactor.wind} km/h.`}\n` +
        `• ⏱️ **Best Window**: **${optimalWindowText}** for ideal outdoor comfort.`;
    } else if (activityId === 'travel') {
      reasoningText = `For **Travel / Drive in ${cityObj.name}**:\n\n` +
        `• 🚗 **Route Outlook**: ${overall.riskLevel === 'SAFE' ? 'Clear roads and good visibility expected.' : `Moderate winds (${specificBlockFactor.wind} km/h) and rain risk (${specificBlockFactor.rain}%). Drive carefully on ghat stretches.`}\n` +
        `• 💡 **Vehicle Advice**: ${specificBlockFactor.rain > 40 || specificBlockFactor.wind > 30 ? 'Car 🚗 is recommended over two-wheelers for safety.' : 'Bike 🏍️ or Car 🚗 are both suitable.'}\n` +
        `• ⏱️ **Best Window**: **${optimalWindowText}**.`;
    } else if (activityId === 'farming') {
      reasoningText = `For **Farming & Crop Operations in ${cityObj.name}**:\n\n` +
        `• 🌾 **Spraying & Irrigation**: ${overall.riskLevel === 'SAFE' ? 'Low rain probability. Excellent time for field spraying.' : `Rain chance is ${specificBlockFactor.rain}%. Suspend pesticide spraying after 2 PM to avoid wind drift.`}\n` +
        `• ⏱️ **Recommended Window**: **${optimalWindowText}**.`;
    } else {
      if (overall.riskLevel === 'SAFE') {
        reasoningText = `Weather conditions in **${cityObj.name} (${cityObj.zone})** are **favorable for ${activityName}**! Rain probability is low (${specificBlockFactor.rain}%), wind speeds are mild (${specificBlockFactor.wind} km/h), and visibility is clear.\n\n` +
          `• ⏱️ **Optimal Window**: **${optimalWindowText}**.`;
      } else if (overall.riskLevel === 'MODERATE') {
        reasoningText = `Caution is advised for **${activityName}** in **${cityObj.name}**. Rain chance is **${specificBlockFactor.rain}%** with wind speed at **${specificBlockFactor.wind} km/h**. Keep protective gear handy.\n\n` +
          `• ⏱️ **Optimal Window**: **${optimalWindowText}**.`;
      } else {
        reasoningText = `⚠️ **High Risk Alert** for **${activityName}** in **${cityObj.name}**. Rain risk is high (**${specificBlockFactor.rain}%**) with wind gusts at **${specificBlockFactor.wind} km/h**. We recommend postponing outdoor plans.`;
      }
    }
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


