/**
 * Risk Engine v2.4
 * Weighted rule-based scoring system that converts raw weather data
 * into GO / CAUTION / AVOID recommendations per activity.
 */

import { ACTIVITIES, TERRAIN_MODIFIERS } from './activityConfig';

const DEFAULT_WEIGHTS = {
  rain: 0.35,
  wind: 0.25,
  visibility: 0.15,
  humidity: 0.15,
  uvIndex: 0.10,
};

/**
 * Compute an individual factor score (0-100) for rain probability.
 */
function scoreRain(rainProbability) {
  if (rainProbability > 80) return 100;
  if (rainProbability > 60) return 80;
  if (rainProbability > 40) return 55;
  if (rainProbability > 20) return 30;
  return 5;
}

/**
 * Compute factor score for wind speed (km/h).
 */
function scoreWind(windSpeed) {
  if (windSpeed > 50) return 100;
  if (windSpeed > 40) return 85;
  if (windSpeed > 25) return 60;
  if (windSpeed > 15) return 35;
  return 5;
}

/**
 * Compute factor score for visibility (meters).
 */
function scoreVisibility(visibility) {
  if (visibility < 500) return 100;
  if (visibility < 1000) return 80;
  if (visibility < 3000) return 55;
  if (visibility < 5000) return 30;
  return 5;
}

/**
 * Compute factor score for humidity (%).
 */
function scoreHumidity(humidity) {
  if (humidity > 95) return 80;
  if (humidity > 85) return 60;
  if (humidity > 70) return 35;
  if (humidity > 50) return 15;
  return 5;
}

/**
 * Compute factor score for UV index.
 */
function scoreUV(uvIndex) {
  if (uvIndex > 10) return 100;
  if (uvIndex > 8) return 80;
  if (uvIndex > 6) return 55;
  if (uvIndex > 3) return 25;
  return 5;
}

/**
 * Score a single forecast block for a specific activity.
 * @param {Object} forecast - { rainProbability, windSpeed, visibility, humidity, uvIndex }
 * @param {string} activityId - Key from ACTIVITIES config
 * @param {string} terrain - 'plains' | 'hills' | 'coastal'
 * @returns {{ totalScore: number, riskLevel: string, factors: Object }}
 */
export function scoreBlock(forecast, activityId, terrain = 'plains') {
  const activity = ACTIVITIES[activityId];
  if (!activity) {
    throw new Error(`Unknown activity: ${activityId}`);
  }

  const weights = activity.weights || DEFAULT_WEIGHTS;
  const modifier = TERRAIN_MODIFIERS[terrain] || TERRAIN_MODIFIERS.plains;

  // Compute raw factor scores
  const rawFactors = {
    rain: scoreRain(forecast.rainProbability || 0),
    wind: scoreWind((forecast.windSpeed || 0) * modifier.windMultiplier),
    visibility: scoreVisibility((forecast.visibility || 10000) * (1 / modifier.visibilityMultiplier)),
    humidity: scoreHumidity(forecast.humidity || 0),
    uvIndex: scoreUV(forecast.uvIndex || 0),
  };

  // Apply terrain modifier to rain score
  rawFactors.rain = Math.min(100, rawFactors.rain * modifier.rainMultiplier);

  // Weighted total
  let totalScore =
    rawFactors.rain * weights.rain +
    rawFactors.wind * weights.wind +
    rawFactors.visibility * weights.visibility +
    rawFactors.humidity * weights.humidity +
    rawFactors.uvIndex * weights.uvIndex;

  // Apply specific hard-rules requested: >60% rain or >40km/h wind = HIGH RISK, 30-60% = MODERATE, else SAFE
  const actualRain = forecast.rainProbability || 0;
  const actualWind = forecast.windSpeed || 0;

  if (actualRain > 60 || actualWind > 40) {
    riskLevel = 'HIGH_RISK';
    totalScore = Math.max(totalScore, 85); // ensure score reflects high risk
  } else if (actualRain >= 30 || (actualWind > 25 && actualWind <= 40)) {
    if (riskLevel !== 'HIGH_RISK') {
      riskLevel = 'MODERATE';
      totalScore = Math.max(totalScore, 50); // ensure score reflects moderate risk
    }
  }

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    riskLevel,
    factors: rawFactors,
    weights,
  };
}

/**
 * Score an array of forecast blocks and find the overall risk + optimal window.
 * @param {Array} forecastBlocks - Array of forecast objects with `dt` (unix timestamp)
 * @param {string} activityId
 * @param {string} terrain
 * @returns {{ overall: Object, blocks: Array, optimalWindow: Object|null }}
 */
export function evaluateTimeline(forecastBlocks, activityId, terrain = 'plains') {
  if (!forecastBlocks || forecastBlocks.length === 0) {
    return { overall: { totalScore: 0, riskLevel: 'SAFE', factors: {} }, blocks: [], optimalWindow: null };
  }

  const scoredBlocks = forecastBlocks.map((block) => {
    const result = scoreBlock(block, activityId, terrain);
    return {
      ...block,
      ...result,
      time: block.dt ? new Date(block.dt * 1000) : new Date(),
    };
  });

  // Overall risk = worst block's risk in the selected time window
  const worstBlock = scoredBlocks.reduce((worst, b) =>
    b.totalScore > worst.totalScore ? b : worst
  );

  // Find optimal 2-hour (2-block for 3hr intervals, or consecutive low-risk blocks) window
  let optimalWindow = null;
  let bestWindowScore = Infinity;

  for (let i = 0; i < scoredBlocks.length - 1; i++) {
    const windowScore = (scoredBlocks[i].totalScore + scoredBlocks[i + 1].totalScore) / 2;
    if (windowScore < bestWindowScore) {
      bestWindowScore = windowScore;
      optimalWindow = {
        start: scoredBlocks[i].time,
        end: scoredBlocks[i + 1].time,
        avgScore: Math.round(windowScore * 10) / 10,
        riskLevel: bestWindowScore >= (ACTIVITIES[activityId]?.thresholds.high || 65)
          ? 'HIGH_RISK'
          : bestWindowScore >= (ACTIVITIES[activityId]?.thresholds.moderate || 35)
            ? 'MODERATE'
            : 'SAFE',
      };
    }
  }

  // Average all factors for the summary
  const avgFactors = {};
  const factorKeys = ['rain', 'wind', 'visibility', 'humidity', 'uvIndex'];
  factorKeys.forEach((key) => {
    avgFactors[key] = Math.round(
      (scoredBlocks.reduce((sum, b) => sum + (b.factors[key] || 0), 0) / scoredBlocks.length) * 10
    ) / 10;
  });

  return {
    overall: {
      totalScore: worstBlock.totalScore,
      riskLevel: worstBlock.riskLevel,
      factors: avgFactors,
      weights: worstBlock.weights,
    },
    blocks: scoredBlocks,
    optimalWindow,
  };
}

/**
 * Get display properties for a risk level.
 */
export function getRiskDisplay(riskLevel) {
  switch (riskLevel) {
    case 'SAFE':
      return { label: 'GO', color: '#10B981', bgColor: '#ECFDF5', borderColor: '#A7F3D0', textColor: '#065F46' };
    case 'MODERATE':
      return { label: 'CAUTION', color: '#F59E0B', bgColor: '#FFFBEB', borderColor: '#FDE68A', textColor: '#92400E' };
    case 'HIGH_RISK':
      return { label: 'AVOID', color: '#EF4444', bgColor: '#FEF2F2', borderColor: '#FECACA', textColor: '#991B1B' };
    default:
      return { label: 'UNKNOWN', color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB', textColor: '#374151' };
  }
}
