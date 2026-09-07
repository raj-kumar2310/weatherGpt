/**
 * Activity Configuration
 * Per-activity thresholds, persona-aware wording, icons, and Tamil Nadu zone data.
 */

export const ACTIVITIES = {
  bike_ride: {
    id: 'bike_ride',
    name: 'Bike Ride',
    subtitle: 'Routes & Trails',
    icon: '🚴',
    color: '#0EA5E9',
    thresholds: { high: 65, moderate: 35 },
    weights: { rain: 0.35, wind: 0.30, visibility: 0.15, humidity: 0.10, uvIndex: 0.10 },
  },
  picnic: {
    id: 'picnic',
    name: 'Picnic',
    subtitle: 'Parks & Lawns',
    icon: '🧺',
    color: '#10B981',
    thresholds: { high: 55, moderate: 30 },
    weights: { rain: 0.40, wind: 0.15, visibility: 0.10, humidity: 0.15, uvIndex: 0.20 },
  },
  farming: {
    id: 'farming',
    name: 'Farming',
    subtitle: 'Irrigation & Spray',
    icon: '🌾',
    color: '#F59E0B',
    thresholds: { high: 60, moderate: 30 },
    weights: { rain: 0.40, wind: 0.25, visibility: 0.10, humidity: 0.15, uvIndex: 0.10 },
  },
  travel: {
    id: 'travel',
    name: 'Travel',
    subtitle: 'Mountain passes',
    icon: '🚗',
    color: '#8B5CF6',
    thresholds: { high: 60, moderate: 35 },
    weights: { rain: 0.30, wind: 0.25, visibility: 0.25, humidity: 0.10, uvIndex: 0.10 },
  },
  outdoor_event: {
    id: 'outdoor_event',
    name: 'Outdoor Event',
    subtitle: 'Setup & Gatherings',
    icon: '🎪',
    color: '#EC4899',
    thresholds: { high: 50, moderate: 25 },
    weights: { rain: 0.40, wind: 0.25, visibility: 0.10, humidity: 0.15, uvIndex: 0.10 },
  },
  fishing: {
    id: 'fishing',
    name: 'Fishing',
    subtitle: 'Lakes & Offshore',
    icon: '🎣',
    color: '#06B6D4',
    thresholds: { high: 70, moderate: 40 },
    weights: { rain: 0.20, wind: 0.35, visibility: 0.20, humidity: 0.10, uvIndex: 0.15 },
  },
};

/** Persona recommendation templates keyed by [userType][riskLevel] */
export const PERSONA_RECOMMENDATIONS = {
  farmer: {
    SAFE: {
      title: 'Conditions are favorable for field work',
      body: 'Safe to spray pesticide and fertilizers. Soil moisture levels are optimal for planting. Irrigation can proceed as scheduled.',
      action: 'Proceed with planned agricultural activities',
    },
    MODERATE: {
      title: 'Exercise caution — weather may shift',
      body: 'Safe to spray pesticide before 8 AM. Avoid irrigation after 2 PM — soil saturation risk. Monitor wind speed for pesticide drift.',
      action: 'Complete high-priority field work early in the day',
    },
    HIGH_RISK: {
      title: 'Postpone all outdoor field operations',
      body: 'Heavy rain expected — risk of waterlogging and soil erosion. Secure livestock shelter. Postpone spraying — chemical runoff risk is high.',
      action: 'Move to indoor processing and planning tasks',
    },
  },
  fisherman: {
    SAFE: {
      title: 'Calm seas — good conditions for launch',
      body: 'Wave height under 0.8m. Wind speed within safe limits. Visibility is excellent for navigation. All offshore zones are accessible.',
      action: 'Launch at planned time — full day fishing feasible',
    },
    MODERATE: {
      title: 'Moderate swell expected — plan return early',
      body: 'Moderate swell expected. Launch by 6 AM. Return before 11 AM. Wave height 1.2m at 2 PM. Coastal zones preferred over deep sea.',
      action: 'Shorten trip and stay within coastal zone',
    },
    HIGH_RISK: {
      title: 'Do not venture out — rough sea warning',
      body: 'High waves and strong winds forecast. Maritime advisory in effect. All fishing operations should be suspended.',
      action: 'Remain at shore — use time for equipment maintenance',
    },
  },
  traveller: {
    SAFE: {
      title: 'All clear — smooth travel conditions',
      body: 'Road visibility is excellent. No weather advisories on your route. All mountain passes are clear and safe.',
      action: 'Travel as planned — no weather delays expected',
    },
    MODERATE: {
      title: 'Travel with caution — conditions may change',
      body: 'NH-181 mountain passes clear until noon. Wind gusts expected at Valparai ghat after 1 PM. Keep headlights on and reduce speed in foggy stretches.',
      action: 'Start early to avoid afternoon weather deterioration',
    },
    HIGH_RISK: {
      title: 'Postpone travel — hazardous conditions',
      body: 'Heavy rain reducing visibility below 500m. Ghat roads slippery — landslide risk elevated. Multiple road closures reported.',
      action: 'Delay departure by 24 hours or take alternate route',
    },
  },
  event_organizer: {
    SAFE: {
      title: 'Perfect weather for your event',
      body: 'Clear skies expected throughout the day. Temperature comfortable for outdoor gatherings. No rain in the forecast window.',
      action: 'Proceed with outdoor setup — no weather cover needed',
    },
    MODERATE: {
      title: 'Prepare contingency plans',
      body: 'Setup window: 7–10 AM. Rain risk at 4 PM — tent/cover plan advised. Wind may affect signage and decorations after noon.',
      action: 'Set up early and have rain covers on standby',
    },
    HIGH_RISK: {
      title: 'Move event indoors or reschedule',
      body: 'Continuous rain and strong winds expected. Outdoor events will be severely impacted. Guest safety cannot be guaranteed.',
      action: 'Activate indoor backup venue immediately',
    },
  },
  common_user: {
    SAFE: {
      title: 'Great weather — enjoy your activity!',
      body: 'Conditions are excellent for outdoor activities. Temperature is comfortable with good visibility and calm winds.',
      action: 'Go ahead with your plans',
    },
    MODERATE: {
      title: 'Proceed with caution',
      body: 'Weather conditions are acceptable but may change. Carry rain protection and stay updated on forecasts. Avoid extended outdoor exposure during peak hours.',
      action: 'Keep your plans flexible and monitor updates',
    },
    HIGH_RISK: {
      title: 'Consider postponing your activity',
      body: 'Adverse weather conditions expected. High chance of rain, strong winds, or poor visibility. Safety should be the top priority.',
      action: 'Reschedule to a safer time window',
    },
  },
};

/** Tamil Nadu cities with micro-zone info */
export const TAMIL_NADU_CITIES = [
  { name: 'Coimbatore', lat: 11.0168, lon: 76.9558, zone: 'Coimbatore Basin', terrain: 'plains', elevation: 411 },
  { name: 'Ooty', lat: 11.4102, lon: 76.6950, zone: 'Nilgiris Belt', terrain: 'hills', elevation: 2240 },
  { name: 'Valparai', lat: 10.3270, lon: 76.9590, zone: 'Anamalai Range', terrain: 'hills', elevation: 1196 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, zone: 'Chennai Coast', terrain: 'coastal', elevation: 6 },
  { name: 'Madurai', lat: 9.9252, lon: 78.1198, zone: 'Vaigai Basin', terrain: 'plains', elevation: 101 },
  { name: 'Salem', lat: 11.6643, lon: 78.1460, zone: 'Salem Plateau', terrain: 'plains', elevation: 278 },
  { name: 'Trichy', lat: 10.7905, lon: 78.7047, zone: 'Kaveri Delta', terrain: 'plains', elevation: 88 },
  { name: 'Kodaikanal', lat: 10.2381, lon: 77.4892, zone: 'Palani Hills', terrain: 'hills', elevation: 2133 },
];

/** Terrain-based threshold modifiers */
export const TERRAIN_MODIFIERS = {
  plains: { windMultiplier: 1.0, rainMultiplier: 1.0, visibilityMultiplier: 1.0 },
  hills: { windMultiplier: 1.3, rainMultiplier: 1.2, visibilityMultiplier: 1.4 },
  coastal: { windMultiplier: 1.2, rainMultiplier: 1.1, visibilityMultiplier: 0.9 },
};

/** Elevation profile data for common routes */
export const ROUTE_PROFILES = {
  'Coimbatore-Ooty': {
    distance: 86,
    elevationGain: 1829,
    points: [
      { km: 0, elevation: 411, label: 'Coimbatore' },
      { km: 15, elevation: 500, label: '' },
      { km: 30, elevation: 650, label: 'Mettupalayam' },
      { km: 45, elevation: 1100, label: 'Kallar' },
      { km: 55, elevation: 1500, label: 'Coonoor' },
      { km: 65, elevation: 1900, label: 'Ketti Valley' },
      { km: 75, elevation: 2100, label: '' },
      { km: 86, elevation: 2240, label: 'Ooty' },
    ],
    zones: [
      { start: 0, end: 30, type: 'Valley Zone', risk: 'low' },
      { start: 30, end: 65, type: 'Mountain Corridor', risk: 'medium' },
      { start: 65, end: 86, type: 'Highland Plateau', risk: 'low' },
    ],
  },
  'Chennai-Madurai': {
    distance: 462,
    elevationGain: 180,
    points: [
      { km: 0, elevation: 6, label: 'Chennai' },
      { km: 80, elevation: 45, label: 'Kanchipuram' },
      { km: 160, elevation: 80, label: 'Villupuram' },
      { km: 250, elevation: 120, label: 'Trichy' },
      { km: 340, elevation: 150, label: 'Dindigul' },
      { km: 462, elevation: 101, label: 'Madurai' },
    ],
    zones: [
      { start: 0, end: 160, type: 'Coastal Plain', risk: 'low' },
      { start: 160, end: 340, type: 'Interior Plain', risk: 'low' },
      { start: 340, end: 462, type: 'Valley Zone', risk: 'low' },
    ],
  },
  'Coimbatore-Valparai': {
    distance: 64,
    elevationGain: 785,
    points: [
      { km: 0, elevation: 411, label: 'Coimbatore' },
      { km: 10, elevation: 380, label: 'Pollachi' },
      { km: 25, elevation: 500, label: '' },
      { km: 35, elevation: 750, label: 'Aliyar' },
      { km: 45, elevation: 950, label: '40 Hairpin Bends' },
      { km: 55, elevation: 1100, label: '' },
      { km: 64, elevation: 1196, label: 'Valparai' },
    ],
    zones: [
      { start: 0, end: 25, type: 'Valley Zone', risk: 'low' },
      { start: 25, end: 55, type: 'Mountain Corridor', risk: 'high' },
      { start: 55, end: 64, type: 'Highland Plateau', risk: 'medium' },
    ],
  },
};

/** Time-of-day labels */
export const TIME_LABELS = {
  5: 'Dawn',
  6: 'Sunrise',
  7: 'Early Morning',
  8: 'Morning',
  9: 'Mid Morning',
  10: 'Late Morning',
  11: 'Pre-Noon',
  12: 'Noon',
  13: 'Early Afternoon',
  14: 'Afternoon',
  15: 'Mid Afternoon',
  16: 'Late Afternoon',
  17: 'Evening',
  18: 'Sunset',
  19: 'Dusk',
  20: 'Night',
};
