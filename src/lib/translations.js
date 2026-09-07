/**
 * Translation Dictionary for WeatherGPT (English & Tamil)
 */

export const TRANSLATIONS = {
  en: {
    // Navigation & Header
    appTitle: 'WeatherAction',
    appSubtitle: 'Weather Decision Engine',
    personaSuffix: 'Mode',
    navHome: 'Home',
    navActivities: 'Activities',
    navPlanner: 'Planner',
    navDecision: 'Decision Matrix',
    navMonitor: 'Live Monitor',
    navAI: 'AI Assistant',

    // Personas
    personaGeneral: 'General Public',
    personaTourist: 'Tourist / Traveler',
    personaFarmer: 'Farmer / Agribusiness',
    personaEvent: 'Event Organizer',

    // Activity Names
    act_bike_ride: 'Bike Ride',
    act_picnic: 'Picnic',
    act_farming: 'Farming',
    act_travel: 'Travel',
    act_outdoor_event: 'Outdoor Event',
    act_fishing: 'Fishing',

    // Input Screen
    stepSelectActivity: 'Select Activity',
    stepPlanDetails: 'Plan Details',
    stepDecisionMatrix: 'Decision Matrix',
    selectedActivityLabel: 'Selected Activity',
    changeBtn: 'Change',
    routeConfigLabel: 'Route Configuration',
    singleLocationBtn: 'Single Location',
    routeModeBtn: 'Route (From → To)',
    startingPointLabel: 'Starting Point (Tamil Nadu Zone)',
    selectStartCity: 'Select starting city…',
    destinationCityLabel: 'Destination City',
    selectDestCity: 'Select destination city…',
    operationalDateLabel: 'Operational Date',
    todayLabel: 'Today',
    tomorrowLabel: 'Tomorrow',
    dayAfterLabel: 'Sun',
    startTimeLabel: 'Start Time',
    endTimeLabel: 'Target End',
    safetyThresholdsTitle: 'Safety & Tolerance Thresholds',
    maxRainTolerance: 'Maximum Rain Tolerance',
    windGustCeiling: 'Wind Gust Ceiling',
    evaluateBtn: 'Evaluate Safety & Generate Decision Matrix',
    dataSourceFooter: 'Multi-model radar: OpenWeatherMap · NOAA GFS · HRRR Tamil Nadu Micro-grid',

    // Decision Screen
    decisionVerdictTitle: 'Safety Verdict',
    goVerdict: 'GO — Safe to proceed',
    cautionVerdict: 'CAUTION — Proceed with care',
    avoidVerdict: 'AVOID — High weather risk',
    riskScoreLabel: 'Composite Risk Index',
    vectorBreakdownTitle: 'Weather Risk Vectors',
    rainRiskLabel: 'Precipitation Risk',
    windRiskLabel: 'Wind & Gust Risk',
    visibilityLabel: 'Road Clearance / Visibility',
    humidityLabel: 'Humidity & Heat Index',
    uvIndexLabel: 'UV Exposure Index',
    routeRiskTitle: 'Route Weather Risk Breakdown',
    climateComparisonTitle: 'Climate Anomaly & Historical Baseline',
    expectedRainLabel: 'Current Forecast Rain',
    historicalAverageLabel: '30-Yr Historical Avg',
    climateStatusAbove: 'Above Historical Average',
    climateStatusNear: 'Near Historical Average',
    climateStatusBelow: 'Below Historical Average',
    actionAdviceTitle: 'Recommended Action & Safety Advice',
    speakAdviceBtn: 'Listen (Voice Advice)',
    stopVoiceBtn: 'Stop Voice',

    // Live Monitoring
    liveMonitorTitle: 'Live Weather Monitoring',
    activePolling: 'Active Polling',
    simulateAlertBtn: 'Simulate Weather Shift Alert',
    riskDriftDetector: 'Weather Risk Drift Detector',

    // AI Copilot Chat
    chatHeader: 'WeatherAI Copilot',
    chatPlaceholder: 'Ask a weather question or Tamil query…',
    sendBtn: 'Send',
    voiceInputBtn: 'Voice Input',
  },
  ta: {
    // Navigation & Header
    appTitle: 'வெதர் ஜிபிடி',
    appSubtitle: 'வானிலை முடிவு எஞ்சின்',
    personaSuffix: 'முறைமை',
    navHome: 'முகப்பு',
    navActivities: 'செயல்பாடுகள்',
    navPlanner: 'திட்டமிடுக',
    navDecision: 'வானிலை முடிவு',
    navMonitor: 'நேரலை கண்காணிப்பு',
    navAI: 'AI உதவி',

    // Personas
    personaGeneral: 'பொது மக்கள்',
    personaTourist: 'சுற்றுலா பயணி',
    personaFarmer: 'விவசாயி',
    personaEvent: 'நிகழ்ச்சி ஏற்பாட்டாளர்',

    // Activity Names
    act_bike_ride: 'பைக் பயணம்',
    act_picnic: 'சுற்றுலா கொண்டாட்டம்',
    act_farming: 'விவசாய பணி',
    act_travel: 'பயணம்',
    act_outdoor_event: 'வெளிப்புற நிகழ்ச்சி',
    act_fishing: 'மீன்பிடித்தல்',

    // Input Screen
    stepSelectActivity: 'செயல்பாடு தேர்வு',
    stepPlanDetails: 'திட்ட விவரங்கள்',
    stepDecisionMatrix: 'முடிவு அணி',
    selectedActivityLabel: 'தேர்ந்தெடுக்கப்பட்ட செயல்பாடு',
    changeBtn: 'மாற்று',
    routeConfigLabel: 'பயண பாதை அமைப்பு',
    singleLocationBtn: 'ஒற்றை இடம்',
    routeModeBtn: 'பாதை (இருந்து → வரை)',
    startingPointLabel: 'தொடக்க இடம் (தமிழ்நாடு மண்டலம்)',
    selectStartCity: 'தொடக்க நகரத்தை தேர்ந்தெடுக்கவும்…',
    destinationCityLabel: 'சேருமிடம்',
    selectDestCity: 'சேருமிட நகரத்தை தேர்ந்தெடுக்கவும்…',
    operationalDateLabel: 'செயல்படும் தேதி',
    todayLabel: 'இன்று',
    tomorrowLabel: 'நாளை',
    dayAfterLabel: 'ஞாயிறு',
    startTimeLabel: 'ஆரம்ப நேரம்',
    endTimeLabel: 'முடிவு நேரம்',
    safetyThresholdsTitle: 'பாதுகாப்பு வரம்புகள்',
    maxRainTolerance: 'அதிகபட்ச மழை சகிப்புத்தன்மை',
    windGustCeiling: 'அதிகபட்ச காற்று வேகம்',
    evaluateBtn: 'பாதுகாப்பு ஆய்வு செய்து முடிவு பெறுக',
    dataSourceFooter: 'வானிலை தரவு: ஓபன்வெதர்மேப் · நோவா ஜிஎஃப்எஸ் · தமிழ்நாடு நுண்-மண்டலம்',

    // Decision Screen
    decisionVerdictTitle: 'பாதுகாப்பு முடிவு',
    goVerdict: 'செல்லலாம் — பாதுகாப்பானது',
    cautionVerdict: 'எச்சரிக்கை — கவனமாக செல்லவும்',
    avoidVerdict: 'தவிர்க்கவும் — அதிக ஆபத்து',
    riskScoreLabel: 'ஒட்டுமொத்த ஆபத்து குறியீடு',
    vectorBreakdownTitle: 'வானிலை ஆபத்து காரணிகள்',
    rainRiskLabel: 'மழை ஆபத்து',
    windRiskLabel: 'காற்று வேகம் ஆபத்து',
    visibilityLabel: 'பார்வை தெளிவு',
    humidityLabel: 'ஈரப்பதம் மற்றும் வெப்பம்',
    uvIndexLabel: 'UV சூரிய கதிர்வீச்சு',
    routeRiskTitle: 'பாதை வானிலை ஆபத்து பகுப்பாய்வு',
    climateComparisonTitle: 'வரலாற்று காலநிலை ஒப்பீடு',
    expectedRainLabel: 'எதிர்பார்க்கப்படும் மழை',
    historicalAverageLabel: '30 வருட வரலாற்று சராசரி',
    climateStatusAbove: 'சராசரியை விட அதிகம்',
    climateStatusNear: 'சராசரி அளவில் உள்ளது',
    climateStatusBelow: 'சராசரியை விட குறைவு',
    actionAdviceTitle: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை & ஆலோசனை',
    speakAdviceBtn: 'குரல் வழிகாட்டி (கேட்கவும்)',
    stopVoiceBtn: 'குரலை நிறுத்தவும்',

    // Live Monitoring
    liveMonitorTitle: 'நேரலை வானிலை கண்காணிப்பு',
    activePolling: 'செயலில் உள்ள கண்காணிப்பு',
    simulateAlertBtn: 'வானிலை மாற்ற எச்சரிக்கை சோதனை',
    riskDriftDetector: 'வானிலை ஆபத்து மாற்றக் கண்டறிதல்',

    // AI Copilot Chat
    chatHeader: 'வானிலை AI உதவியாளர்',
    chatPlaceholder: 'வானிலை கேள்வி அல்லது தமிழ் வினவலை டைப் செய்யவும்…',
    sendBtn: 'அனுப்பு',
    voiceInputBtn: 'குரல் பதிவு',
  },
};

export function t(key, lang = 'en') {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dictionary[key] || TRANSLATIONS.en[key] || key;
}
