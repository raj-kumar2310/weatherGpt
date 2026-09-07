/**
 * Personal Comfort Score Engine
 * Computes a 0–10 Personal Comfort Score based on user personalized tolerances
 * (heat, humidity, wind, rain) without affecting the deterministic Safety Risk verdict.
 */

export function calculateComfortScore(weather, preferences = {}) {
  if (!weather) return { score: 7.5, rating: 'Comfortable', reason: 'Moderate weather conditions' };

  const {
    heatTolerance = 'medium',       // 'low' | 'medium' | 'high'
    humidityTolerance = 'medium',   // 'low' | 'medium' | 'high'
    windTolerance = 'medium',       // 'low' | 'medium' | 'high'
    rainTolerance = 'medium',       // 'low' | 'medium' | 'high'
  } = preferences;

  const temp = weather.temp || 28;
  const humidity = weather.humidity || 60;
  const windSpeed = weather.windSpeed || 15;
  const rainProb = weather.rainProbability || 10;

  let score = 10;
  const deductions = [];

  // Temperature evaluation
  const idealTempMax = heatTolerance === 'high' ? 34 : heatTolerance === 'medium' ? 30 : 26;
  if (temp > idealTempMax) {
    const diff = temp - idealTempMax;
    const penalty = Math.min(3.5, diff * 0.7);
    score -= penalty;
    deductions.push(`Temperature (${temp}°C) is warmer than your preferred ${idealTempMax}°C max`);
  } else if (temp < 18) {
    score -= 1.5;
    deductions.push(`Temperature (${temp}°C) is cooler than typical comfort baseline`);
  }

  // Humidity evaluation
  const idealHumidityMax = humidityTolerance === 'high' ? 85 : humidityTolerance === 'medium' ? 70 : 55;
  if (humidity > idealHumidityMax) {
    const penalty = Math.min(2.5, (humidity - idealHumidityMax) * 0.08);
    score -= penalty;
    deductions.push(`High humidity (${humidity}%) makes conditions feel stickier`);
  }

  // Wind evaluation
  const idealWindMax = windTolerance === 'high' ? 35 : windTolerance === 'medium' ? 25 : 15;
  if (windSpeed > idealWindMax) {
    const penalty = Math.min(2.0, (windSpeed - idealWindMax) * 0.1);
    score -= penalty;
    deductions.push(`Breezy winds (${windSpeed} km/h) exceed your ${idealWindMax} km/h preference`);
  }

  // Rain probability evaluation
  const idealRainMax = rainTolerance === 'high' ? 50 : rainTolerance === 'medium' ? 30 : 15;
  if (rainProb > idealRainMax) {
    const penalty = Math.min(2.5, (rainProb - idealRainMax) * 0.06);
    score -= penalty;
    deductions.push(`Rain chance (${rainProb}%) is higher than your ${idealRainMax}% preference`);
  }

  const finalScore = Math.max(1.0, Math.min(10.0, Math.round(score * 10) / 10));

  let rating = 'Very Comfortable';
  if (finalScore < 4.0) rating = 'Uncomfortable';
  else if (finalScore < 6.0) rating = 'Moderate Comfort';
  else if (finalScore < 8.0) rating = 'Comfortable';

  const reason = deductions.length > 0
    ? deductions[0]
    : 'Atmospheric conditions align well with your personal comfort preferences.';

  return {
    score: finalScore,
    rating,
    reason,
    allDeductions: deductions,
  };
}
