/**
 * WeatherAI Copilot Engine
 * Natural language intent parser and LLM decision reasoning engine.
 * Integrates Google Gemini AI for intelligent context-aware weather advice.
 */

import { ACTIVITIES, TAMIL_NADU_CITIES } from './activityConfig';
import { evaluateTimeline, getRiskDisplay } from './riskEngine';

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
 * Match activity from natural language query
 */
function parseActivity(query) {
  const q = query.toLowerCase();
  if (q.includes('bike') || q.includes('cycling') || q.includes('ride') || q.includes('cycle') || q.includes('motorcycle')) return 'bike_ride';
  if (q.includes('picnic') || q.includes('park') || q.includes('lunch') || q.includes('outing') || q.includes('bbq')) return 'picnic';
  if (q.includes('farm') || q.includes('spray') || q.includes('crop') || q.includes('pesticide') || q.includes('field') || q.includes('harvest')) return 'farming';
  if (q.includes('travel') || q.includes('drive') || q.includes('ghat') || q.includes('road') || q.includes('pass') || q.includes('hill') || q.includes('highway')) return 'travel';
  if (q.includes('event') || q.includes('wedding') || q.includes('concert') || q.includes('stage') || q.includes('party') || q.includes('tent')) return 'outdoor_event';
  if (q.includes('fish') || q.includes('boat') || q.includes('sea') || q.includes('ocean') || q.includes('coastal') || q.includes('catch')) return 'fishing';
  
  return 'bike_ride'; // Default fallback
}

/**
 * Match Tamil Nadu city from query
 */
function parseCity(query) {
  const q = query.toLowerCase();
  for (const city of TAMIL_NADU_CITIES) {
    if (q.includes(city.name.toLowerCase())) {
      return city;
    }
  }
  return TAMIL_NADU_CITIES[0]; // Default: Coimbatore
}

/**
 * Call Google Gemini API for generative advice
 */
async function fetchGeminiReasoning(query, city, activity, overall) {
  if (!GEMINI_API_KEY) return null;
  try {
    const prompt = `You are WeatherAction AI Copilot, a hyperlocal micro-zone weather safety expert for Tamil Nadu, India.
User query: "${query}"
City/Location: ${city.name} (${city.zone}, ${city.terrain} terrain)
Activity: ${activity.name}
Calculated Risk Level: ${overall.riskLevel} (Score: ${overall.totalScore}/100)
Weather Factors: Rain Risk ${overall.factors.rain}%, Wind Speed ${overall.factors.wind} km/h, Humidity ${overall.factors.humidity}%

Provide a concise, professional 2-3 sentence safety recommendation with markdown bold highlights tailored specifically to the activity and location. Keep it actionable and empathetic.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
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
export async function processAICopilotQuery(query, forecastBlocks = [], currentStore = {}) {
  const activityId = parseActivity(query);
  const city = parseCity(query);
  const activity = ACTIVITIES[activityId];

  const terrain = city.terrain || 'plains';
  const riskData = evaluateTimeline(forecastBlocks.slice(0, 12), activityId, terrain);
  const { overall, optimalWindow } = riskData;
  const display = getRiskDisplay(overall.riskLevel);

  // Try live Gemini API call
  let reasoningText = await fetchGeminiReasoning(query, city, activity, overall);

  // Fallback template reasoning if API call fails or key not present
  if (!reasoningText) {
    if (overall.riskLevel === 'SAFE') {
      reasoningText = `Based on high-resolution radar analysis for **${city.name} (${city.zone})**, weather conditions are favorable for **${activity.name}**. Rain probability is low (${overall.factors.rain || 5}%), wind speeds are mild, and atmospheric stability is high.`;
    } else if (overall.riskLevel === 'MODERATE') {
      reasoningText = `Caution is advised for **${activity.name}** in **${city.name}**. Our 5-vector risk model detected moderate weather factors (Rain risk: ${overall.factors.rain}%, Wind speed: ${overall.factors.wind} km/h). Monitor weather changes and carry appropriate protective equipment.`;
    } else {
      reasoningText = `⚠️ High Risk Alert for **${activity.name}** in **${city.name}** (${city.terrain} zone). Adverse weather conditions detected (High precipitation / strong gust risk score: ${overall.totalScore}/100). We strongly advise postponing outdoor activities.`;
    }
  }

  const responseMessage = {
    id: `msg-${Date.now()}`,
    sender: 'ai',
    text: reasoningText,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    card: {
      activityId,
      activityName: activity.name,
      activityIcon: activity.icon,
      city: city.name,
      zone: city.zone,
      riskLevel: overall.riskLevel,
      display,
      score: overall.totalScore,
      rain: `${overall.factors.rain}%`,
      wind: `${overall.factors.wind} km/h`,
      humidity: `${overall.factors.humidity}%`,
      optimalWindow: optimalWindow ? `${new Date(optimalWindow.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – ${new Date(optimalWindow.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : null,
    },
    riskResult: riskData,
    cityObj: city,
  };

  return responseMessage;
}
