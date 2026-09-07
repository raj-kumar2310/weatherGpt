/**
 * WeatherAI Copilot Engine
 * Natural language intent parser and LLM decision reasoning engine.
 * Integrates Google Gemini AI + Conversational Fallback Engine for intelligent context-aware weather advice.
 */

import { ACTIVITIES, TAMIL_NADU_CITIES, matchCity } from './activityConfig';
import { evaluateTimeline, getRiskDisplay } from './riskEngine';
import { searchCities, fetchForecast, fetchCurrentWeather, normalizeCurrentWeather } from './weatherApi';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

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
  { text: 'Nalaki Coimbatore Mala varuma?', icon: '🌧️' },
  { text: 'Which place best for picnic coimbatore based weather?', icon: '🧺' },
  { text: 'Nalaki weather enna epdi erukum entha place polama?', icon: '✨' },
  { text: 'What is the current temperature in Coimbatore?', icon: '🌡️' },
  { text: 'Can I go for a run in Kuniyamuthur tomorrow at 5 AM?', icon: '🏃' },
  { text: 'Is it safe to travel to Valparai ghat road tomorrow?', icon: '🚗' },
];

/**
 * Curated place recommendations for Tamil Nadu cities and micro-zones
 */
export function getPopularPlacesForCity(cityName = '', activityId = 'picnic') {
  const city = (cityName || '').toLowerCase();

  if (city.includes('coimbatore') || city.includes('kovai')) {
    if (activityId === 'picnic' || activityId === 'outdoor_event' || activityId === 'general') {
      return [
        { name: 'VOC Park & Botanical Gardens', desc: 'Ideal for family outings, lush green shade, and pleasant lawns.' },
        { name: 'Singanallur Lake & Eco Park', desc: 'Beautiful lakeside spot for nature walks and morning birdwatching.' },
        { name: 'Siruvani Foothills & Kovai Kutralam', desc: 'Lush greenery and fresh mountain air (Best: 6:00 AM – 10:00 AM).' },
        { name: 'Brookefields / Prozone Mall', desc: 'Convenient indoor shopping & food court option if afternoon turns warm.' },
      ];
    }
    if (activityId === 'travel' || activityId === 'bike_ride') {
      return [
        { name: 'Valparai Ghat Road (40 Hairpin Bends)', desc: 'Scenic mountain route with tea estates and crisp mountain air.' },
        { name: 'Aliyar Dam & Park', desc: 'Serene reservoir spot with expansive water views.' },
        { name: 'Siruvani Road', desc: 'Lush green stretch perfect for early morning drive.' },
      ];
    }
  }

  if (city.includes('ooty') || city.includes('nilgiri') || city.includes('coonoor')) {
    return [
      { name: 'Government Botanical Garden', desc: 'Sprawling 55-acre landscaped flower beds and lawns.' },
      { name: 'Ooty Lake & Boathouse', desc: 'Scenic boating surrounded by eucalyptus trees.' },
      { name: 'Doddabetta Peak', desc: 'Highest peak in Nilgiris offering panoramic valley views.' },
      { name: 'Pykara Lake & Waterfalls', desc: 'Tranquil dam site and cascading water streams.' },
    ];
  }

  if (city.includes('kuniyamuthur') || city.includes('kovaipudur')) {
    return [
      { name: 'Kovaipudur Hill View Park', desc: 'Elevated park with mountain breezes and sunset views.' },
      { name: 'SKCET Campus Green Lawns', desc: 'Quiet leafy walking trails and tree cover.' },
      { name: 'VOC Park (15 min drive)', desc: 'Nearest major city garden for family picnic.' },
    ];
  }

  if (city.includes('namakkal')) {
    return [
      { name: 'Namakkal Anjaneyar Fort Hill', desc: 'Historic hilltop fort with architecture and city view.' },
      { name: 'Kolli Hills (Seekuparai Viewpoint)', desc: '70 hairpin bends mountain trail with fresh breezes.' },
      { name: 'Jedarpalayam Dam Park', desc: 'Riverfront park along Cauvery river.' },
    ];
  }

  if (city.includes('madurai')) {
    return [
      { name: 'Vandiyur Mariamman Teppakulam', desc: 'Historic temple tank with peaceful perimeter walking.' },
      { name: 'Eco Park (KK Nagar)', desc: 'Landscaped park with shaded seating and fountains.' },
      { name: 'Samangar Malai (Jain Caves)', desc: 'Historic rocky hill top for morning trek.' },
    ];
  }

  if (city.includes('chennai')) {
    return [
      { name: 'Semmozhi Poonga Botanical Garden', desc: 'Lush green garden in heart of city with rare plants.' },
      { name: 'Elliot’s Beach (Besant Nagar)', desc: 'Clean, peaceful beach front for morning picnic.' },
      { name: 'Guindy National Park', desc: 'Protected urban forest with deer park and shaded trails.' },
    ];
  }

  if (city.includes('pollachi') || city.includes('valparai')) {
    return [
      { name: 'Aliyar Dam Park', desc: 'Beautiful garden at foothills of Anamalai hills.' },
      { name: 'Monkey Falls', desc: 'Natural waterfall spot surrounded by dense green forest.' },
      { name: 'Sholayar Dam Viewpoint', desc: 'Massive reservoir surrounded by mist-covered tea gardens.' },
    ];
  }

  // Default fallback for any other location
  return [
    { name: `${cityName} Botanical Park`, desc: 'Central public garden with shade trees and walking tracks.' },
    { name: `${cityName} Lakefront Promenade`, desc: 'Pleasant open waterfront area for morning/evening gatherings.' },
    { name: `${cityName} Hill View Point`, desc: 'Elevated vantage spot for fresh air and views.' },
  ];
}

/**
 * Detect Tamil / Tanglish in user query
 */
export function detectTanglishOrTamil(query = '') {
  const q = query.toLowerCase();
  const tamilRegex = /[\u0B80-\u0BFF]/;
  if (tamilRegex.test(query)) return true;

  const tanglishKeywords = [
    'nalaki', 'naalaki', 'naalai', 'nalaiku', 'iniku', 'innaiku', 'mazhai', 'mazai', 'mala',
    'varuma', 'eruka', 'iruka', 'polam', 'polama', 'panalam', 'panalama', 'enga', 'epdi',
    'irukum', 'erukum', 'solla', 'sollu', 'nalla', 'nalladhu'
  ];
  return tanglishKeywords.some((k) => q.includes(k));
}

/**
 * Smart Conversational Response Generator (ChatGPT / Gemini style)
 * Generates natural, context-aware weather advice with place recommendations,
 * rain probabilities, and activity safety in Tamil or English.
 */
export function generateSmartConversationalResponse({
  query,
  cityObj,
  weatherData,
  isTomorrow,
  isRainQuery,
  isPlaceQuery,
  activityId,
  activityName,
  optimalWindowText = '06:00 AM – 09:30 AM',
  language = 'en',
}) {
  const isTa = language === 'ta' || detectTanglishOrTamil(query);
  const cityName = cityObj?.name || 'Coimbatore';
  const temp = Math.round(weatherData?.temp || 26);
  const feelsLike = Math.round(weatherData?.feelsLike || temp);
  const desc = weatherData?.weatherDesc || 'overcast clouds';
  const rainProb = weatherData?.rainProbability ?? 0;
  const windSpeed = Math.round(weatherData?.windSpeed || 14);
  const humidity = Math.round(weatherData?.humidity || 67);
  const timeLabel = isTomorrow ? (isTa ? 'நாளை' : 'tomorrow') : (isTa ? 'இன்று' : 'today');

  // CATEGORY 1: Direct Rain Query ("nalaiku Coimbatore Mala varuma", "rain chance in Ooty")
  if (isRainQuery && !isPlaceQuery) {
    if (rainProb === 0) {
      if (isTa) {
        return `நல்ல செய்தி! **${cityName}** இல் ${timeLabel} **மழை பெய்ய வாய்ப்பில்லை (0% மழை வாய்ப்பு)**! 🌤️\n\n` +
          `• 🌧️ மழை வாய்ப்பு: **0%** (குடை தேவையில்லை!)\n` +
          `• 🌡️ வெப்பநிலை: **${temp}°C** (உணரும் வெப்பநிலை: **${feelsLike}°C**)\n` +
          `• 💨 காற்றின் வேகம்: **${windSpeed} km/h** (${desc})\n` +
          `• 💧 ஈரப்பதம்: **${humidity}%**\n\n` +
          `💡 **வானிலை ஆலோசனை**: வானம் மேகமூட்டத்துடன் இதமாக இருக்கும். காலை **${optimalWindowText}** நடைபயிற்சி, பயணம் மற்றும் வெளிப்புற திட்டங்களுக்கு மிகவும் ஏற்ற நேரமாகும்.`;
      } else {
        return `Good news! **No rain is expected** in **${cityName}** ${timeLabel} (**0% rain probability**). Weather will be pleasant with **${desc}** (${temp}°C) 🌤️.\n\n` +
          `• 🌧️ Rain Probability: **0%** (No umbrella needed!)\n` +
          `• 🌡️ Temperature: **${temp}°C** (Feels like **${feelsLike}°C**)\n` +
          `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
          `• 💧 Humidity: **${humidity}%**\n\n` +
          `💡 **Weather Insight**: Sky will be mostly overcast with mild temperatures. Morning hours between **${optimalWindowText}** offer the best comfort for outdoor activities and travel.`;
      }
    } else if (rainProb < 40) {
      if (isTa) {
        return `**${cityName}** இல் ${timeLabel} **மழைக்கான வாய்ப்பு மிகக் குறைவு (${rainProb}%)**. வானிலை உலர்ந்த மேகமூட்டத்துடன் இதமாக இருக்கும் (${temp}°C) 🌤️.\n\n` +
          `• 🌧️ மழை வாய்ப்பு: **${rainProb}%**\n` +
          `• 🌡️ வெப்பநிலை: **${temp}°C** (உணரும் வெப்பநிலை: **${feelsLike}°C**)\n` +
          `• 💨 காற்றின் வேகம்: **${windSpeed} km/h**\n` +
          `• 💧 ஈரப்பதம்: **${humidity}%**\n\n` +
          `💡 **வானிலை ஆலோசனை**: சிறிய தூறல் வர வாய்ப்பு உள்ளது, ஆனால் பெரிய மழை இருக்காது. வெளியே செல்லலாம்!`;
      } else {
        return `There is a **very low chance of rain (${rainProb}%)** in **${cityName}** ${timeLabel}. Weather will be mostly dry and pleasant with **${desc}** (${temp}°C) 🌤️.\n\n` +
          `• 🌧️ Rain Probability: **${rainProb}%**\n` +
          `• 🌡️ Temperature: **${temp}°C** (Feels like **${feelsLike}°C**)\n` +
          `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
          `• 💧 Humidity: **${humidity}%**\n\n` +
          `💡 **Weather Insight**: Mild weather ahead. Feel free to plan outdoor workouts or local travel.`;
      }
    } else {
      if (isTa) {
        return `ஆமாம்! **${cityName}** இல் ${timeLabel} **மழை பெய்ய அதிக வாய்ப்புள்ளது (${rainProb}% மழை வாய்ப்பு)**. வெளியே செல்லும் போது கட்டாயம் குடை அல்லது ரெயின்கோட் எடுத்துச் செல்லவும்! ☔\n\n` +
          `• 🌧️ மழை வாய்ப்பு: **${rainProb}%**\n` +
          `• 🌡️ வெப்பநிலை: **${temp}°C** (உணரும் வெப்பநிலை: **${feelsLike}°C**)\n` +
          `• 💨 காற்றின் வேகம்: **${windSpeed} km/h**\n` +
          `• 💧 ஈரப்பதம்: **${humidity}%**\n\n` +
          `💡 **பாதுகாப்பு குறிப்பு**: பிற்பகல் நேரத்தில் மழை தீவிரமடையலாம். காலை **${optimalWindowText}** நேரத்திற்குள் உங்கள் பணிகளை முடிக்கப் பரிந்துரைக்கப்படுகிறது.`;
      } else {
        return `Yes! **Rain is expected (${rainProb}% probability)** in **${cityName}** ${timeLabel}. Heavy clouds and scattered showers are likely, so please carry an umbrella or raincoat! ☔\n\n` +
          `• 🌧️ Rain Probability: **${rainProb}%**\n` +
          `• 🌡️ Temperature: **${temp}°C** (Feels like **${feelsLike}°C**)\n` +
          `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
          `• 💧 Humidity: **${humidity}%**\n\n` +
          `💡 **Safety Tip**: Rain intensity may peak in the afternoon. Try to finish outdoor activities during the early window (**${optimalWindowText}**).`;
      }
    }
  }

  // CATEGORY 2: Place / Picnic / Destination Query ("which place best for picnic coimbatore based weather")
  if (isPlaceQuery || activityId === 'picnic') {
    const places = getPopularPlacesForCity(cityName, activityId);
    if (isTa) {
      let placeListStr = places.map((p) => `• 🌿 **${p.name}**: ${p.desc}`).join('\n');
      return `${timeLabel} **${cityName}** வானிலை (${temp}°C, ${desc}, ${rainProb}% மழை வாய்ப்பு) பிக்னிக் மற்றும் வெளிப்புற உலாவுவதற்கு மிகவும் இதமாக உள்ளது! 🧺🌤️\n\n` +
        `📍 **${cityName} பிக்னிக் செல்ல சிறந்த இடங்கள் (வானிலை அடிப்படையில்)**:\n${placeListStr}\n\n` +
        `• ⏱️ **சிறந்த நேர இடைவெளி**: **${optimalWindowText}**\n` +
        `• 🌧️ மழை வாய்ப்பு: **${rainProb}%** | 💨 காற்று: **${windSpeed} km/h** | 💧 ஈரப்பதம்: **${humidity}%**`;
    } else {
      let placeListStr = places.map((p) => `• 🌿 **${p.name}**: ${p.desc}`).join('\n');
      return `${isTomorrow ? "Tomorrow's" : "Today's"} weather in **${cityName}** (${temp}°C, ${desc}, ${rainProb}% Rain chance) is **pleasant and great for a picnic**! 🧺🌤️\n\n` +
        `📍 **Best Picnic Places in ${cityName} (Weather-based)**:\n${placeListStr}\n\n` +
        `• ⏱️ **Optimal Start Window**: **${optimalWindowText}**\n` +
        `• 🌧️ Rain Chance: **${rainProb}%** | 💨 Wind: **${windSpeed} km/h** | 💧 Humidity: **${humidity}%**`;
    }
  }

  // CATEGORY 3: Travel / Drive / Route Activity Query
  if (activityId === 'travel' || activityId === 'bike_ride') {
    const places = getPopularPlacesForCity(cityName, activityId);
    const vehicleAdvice = (rainProb > 30 || windSpeed > 25)
      ? (isTa ? 'மழை/காற்று அதிகம் என்பதால் கார் 🚗 பரிந்துரைக்கப்படுகிறது.' : 'Car 🚗 is recommended over two-wheelers due to wind/rain risk.')
      : (isTa ? 'பைக் 🏍️ அல்லது கார் 🚗 இரண்டிலும் பயணம் செய்யலாம்.' : 'Bike 🏍️ or Car 🚗 are both suitable for this weather.');

    if (isTa) {
      let routeStr = places.slice(0, 3).map((p) => `• 🛣️ **${p.name}**: ${p.desc}`).join('\n');
      return `**${cityName}** பயணம் குறித்த வானிலை ஆலோசனை (${temp}°C, ${desc}):\n\n` +
        `🚗 **பயண வானிலை & வாகனப் பரிந்துரை**:\n${vehicleAdvice}\n\n` +
        `📍 **சிறந்த பயண பாதைகள் & இடங்கள்**:\n${routeStr}\n\n` +
        `• ⏱️ **பாதுகாப்பான பயண நேரம்**: **${optimalWindowText}**\n` +
        `• 🌧️ மழை வாய்ப்பு: **${rainProb}%** | 💨 காற்றின் வேகம்: **${windSpeed} km/h**`;
    } else {
      let routeStr = places.slice(0, 3).map((p) => `• 🛣️ **${p.name}**: ${p.desc}`).join('\n');
      return `Weather outlook for **Travel / Drive in ${cityName}** (${temp}°C, ${desc}):\n\n` +
        `🚗 **Vehicle & Travel Safety**:\n${vehicleAdvice}\n\n` +
        `📍 **Recommended Routes & Scenic Spots**:\n${routeStr}\n\n` +
        `• ⏱️ **Optimal Driving Window**: **${optimalWindowText}**\n` +
        `• 🌧️ Rain Chance: **${rainProb}%** | 💨 Wind Speed: **${windSpeed} km/h**`;
    }
  }

  // CATEGORY 4: General / Farming / Running / Default Fallback
  if (isTa) {
    return `${timeLabel} **${cityName}** வானிலை நிலைமை (${temp}°C, ${desc}):\n\n` +
      `• 🌧️ மழை வாய்ப்பு: **${rainProb}%** (${rainProb === 0 ? 'குடை தேவையில்லை' : 'தூறல் வரலாம்'})\n` +
      `• 🌡️ வெப்பநிலை: **${temp}°C** (உணரும் வெப்பநிலை: **${feelsLike}°C**)\n` +
      `• 💨 காற்றின் வேகம்: **${windSpeed} km/h**\n` +
      `• 💧 ஈரப்பதம்: **${humidity}%**\n\n` +
      `⏱️ **சிறந்த வெளிப்புற நேரம்**: **${optimalWindowText}**`;
  } else {
    return `${isTomorrow ? "Tomorrow's" : "Today's"} weather forecast for **${cityName}** (${temp}°C, ${desc}):\n\n` +
      `• 🌧️ Rain Probability: **${rainProb}%** (${rainProb === 0 ? 'No rain expected' : 'Possibility of light showers'})\n` +
      `• 🌡️ Temperature: **${temp}°C** (Feels like **${feelsLike}°C**)\n` +
      `• 💨 Wind Speed: **${windSpeed} km/h**\n` +
      `• 💧 Humidity: **${humidity}%**\n\n` +
      `⏱️ **Recommended Window**: **${optimalWindowText}**`;
  }
}

/**
 * Fallback intent classification & parsing
 */
function parseIntentFallback(query) {
  const q = query.toLowerCase();

  const isTomorrow = ['nalaki', 'naalaki', 'naalai', 'nalaiku', 'tomorrow', 'next day', 'nalai'].some((k) => q.includes(k));
  const isRainQuery = ['rain', 'mazhai', 'mazai', 'rainu', 'chance', 'mala', 'varuma'].some((k) => q.includes(k));
  const isPlaceQuery = ['place', 'where', 'enga', 'polam', 'polama', 'suggest', 'recommend', 'visit', 'spot', 'places', 'best'].some((k) => q.includes(k));

  const activityKeywords = [
    'run', 'jog', 'walk', 'marathon', 'sprint', 'bike', 'cycling', 'ride', 'cycle',
    'picnic', 'park', 'farm', 'spray', 'crop', 'pesticide', 'travel', 'drive', 'ghat',
    'event', 'wedding', 'fish', 'boat', 'sea', 'ocean'
  ];
  const hasActivity = activityKeywords.some((k) => q.includes(k));
  const city = parseCityFallback(query);

  if (!hasActivity && !isPlaceQuery) {
    return {
      isActivityQuery: false,
      locationName: city.name,
      city,
      isTomorrow,
      isRainQuery,
      isPlaceQuery,
    };
  }

  let activityId = 'picnic';
  let activityName = 'Picnic';
  let activityIcon = '🧺';

  if (q.includes('run') || q.includes('jog') || q.includes('walk') || q.includes('marathon') || q.includes('sprint') || q.includes('bike') || q.includes('cycling') || q.includes('ride') || q.includes('cycle')) {
    const isRun = q.includes('run') || q.includes('jog') || q.includes('marathon') || q.includes('walk');
    activityId = 'bike_ride';
    activityName = isRun ? 'Running / Jogging' : 'Bike Ride';
    activityIcon = isRun ? '🏃' : '🚴';
  } else if (q.includes('picnic') || q.includes('park') || q.includes('lunch') || q.includes('outing') || isPlaceQuery) {
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
    isPlaceQuery,
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
 * Call Gemini AI to extract intent
 */
async function extractIntentWithGemini(query) {
  if (!GEMINI_API_KEY) return null;
  try {
    const prompt = `Analyze this user weather chatbot query: "${query}"
Extract intent as JSON with structure:
{
  "isActivityQuery": boolean,
  "locationName": "location or city mentioned (e.g. Coimbatore, Ooty, Kuniyamuthur, Namakkal, Madurai)",
  "isTomorrow": boolean,
  "isRainQuery": boolean,
  "isPlaceQuery": boolean (true if user asks which place to visit or for place recommendations),
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
async function fetchGeminiGeneralResponse(query, cityObj, currentWeatherData, forecastData, isTomorrow, isRainQuery, isPlaceQuery, language = 'en') {
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

    const isTa = language === 'ta' || detectTanglishOrTamil(query);
    const langPrompt = isTa ? 'LANGUAGE INSTRUCTION: Please provide the response in clear, helpful, conversational Tamil.' : '';

    const prompt = `You are WeatherAction Assistant, a smart decision-making weather assistant for Tamil Nadu, India.
User query: "${query}"
Location: ${cityObj.name} (${cityObj.zone})
Day Target: ${isTomorrow ? 'Tomorrow' : 'Today'}
Weather Data: Rain ${rainProb}%, Temp ${temp}°C, Condition: ${weatherDesc}, Wind ${windSpeed} km/h.

${langPrompt}

Answer the user's question directly and conversationally like ChatGPT:
- If user asked for places or picnic spots, recommend 3-4 specific real local places in ${cityObj.name} (e.g. VOC Park, Singanallur Lake, Siruvani Foothills).
- If user asked about rain, give a direct "Yes" or "No" first with exact rain chance %.
- Include weather highlights, temperature, rain chance, and best start window. Keep it warm, clear, and helpful.`;

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
    const isTa = language === 'ta' || detectTanglishOrTamil(query);
    const langPrompt = isTa ? 'LANGUAGE INSTRUCTION: Please provide the safety recommendation in clear, natural conversational Tamil language.' : '';
    const prompt = `You are WeatherAction Assistant, a smart decision-making weather assistant for Tamil Nadu, India.
User query: "${query}"
City/Location: ${city.name} (${city.zone})
Activity/Topic: ${activityName}
Calculated Risk Level: ${overall.riskLevel} (Score: ${overall.totalScore}/100)
Weather Factors: Rain Risk ${overall.factors.rain}%, Wind Speed ${overall.factors.wind} km/h, Humidity ${overall.factors.humidity}%

${langPrompt}

Answer the user's question directly and conversationally like ChatGPT:
1. Recommend 3-4 specific local places in ${city.name} if they asked for places/picnic, or direct vehicle safety advice if they asked about travel.
2. Explicitly state weather forecast (temperature, rain probability %, wind speed).
3. Use markdown bold highlights. Keep it friendly and natural.`;

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

  const isPlaceQuery = geminiIntent?.isPlaceQuery !== undefined
    ? geminiIntent.isPlaceQuery
    : fallbackIntent.isPlaceQuery;

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

  // Resolve target forecast block
  let targetBlock = forecastBlocks[0] || {};
  if (isTomorrow && forecastBlocks.length >= 4) {
    const tomorrowBlocks = forecastBlocks.slice(4, 12);
    if (tomorrowBlocks.length > 0) {
      targetBlock = tomorrowBlocks.reduce((max, b) => (b.rainProbability > max.rainProbability ? b : max), tomorrowBlocks[0]);
    }
  }

  const weatherData = {
    temp: targetBlock.temp || currentWeatherData?.temp || 26,
    feelsLike: targetBlock.feelsLike || currentWeatherData?.feelsLike || 26,
    weatherDesc: targetBlock.weatherDesc || currentWeatherData?.weatherDesc || 'overcast clouds',
    humidity: targetBlock.humidity || currentWeatherData?.humidity || 67,
    windSpeed: targetBlock.windSpeed || currentWeatherData?.windSpeed || 14,
    rainProbability: targetBlock.rainProbability ?? currentWeatherData?.rainProbability ?? 0,
  };

  // -------------------------------------------------------------
  // CASE 1: Conversational Weather / Temperature Query (isActivityQuery = false)
  // -------------------------------------------------------------
  if (!isActivityQuery && !isPlaceQuery) {
    let generalText = await fetchGeminiGeneralResponse(query, cityObj, currentWeatherData, forecastBlocks, isTomorrow, isRainQuery, isPlaceQuery, language);

    if (!generalText) {
      generalText = generateSmartConversationalResponse({
        query,
        cityObj,
        weatherData,
        isTomorrow,
        isRainQuery,
        isPlaceQuery: false,
        activityId: null,
        language,
      });
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: generalText,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      card: null,
      cityObj,
      forecastBlocks,
    };
  }

  // -------------------------------------------------------------
  // CASE 2: Activity / Place / Picnic / Travel Query
  // -------------------------------------------------------------
  const activityId = geminiIntent?.activityId || fallbackIntent.activityId || 'picnic';
  const activityName = geminiIntent?.activityName || fallbackIntent.activityName || 'Picnic';
  const activityIcon = geminiIntent?.activityIcon || fallbackIntent.activityIcon || '🧺';
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

  let optimalWindowText = '06:00 AM – 09:30 AM';
  if (optimalWindow && optimalWindow.start && optimalWindow.end) {
    try {
      optimalWindowText = `${new Date(optimalWindow.start).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })} – ${new Date(optimalWindow.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {}
  }

  let reasoningText = await fetchGeminiReasoning(query, cityObj, activityName, overall, timeWindow, language);

  if (!reasoningText) {
    reasoningText = generateSmartConversationalResponse({
      query,
      cityObj,
      weatherData: {
        ...weatherData,
        rainProbability: specificBlockFactor.rain,
        windSpeed: specificBlockFactor.wind,
        humidity: specificBlockFactor.humidity,
      },
      isTomorrow,
      isRainQuery,
      isPlaceQuery,
      activityId,
      activityName,
      optimalWindowText,
      language,
      overallRisk: overall,
    });
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
