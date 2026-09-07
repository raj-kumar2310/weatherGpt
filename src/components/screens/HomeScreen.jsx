'use client';
import { motion } from 'framer-motion';
import { MapPin, Wind, Droplets, Sun, Eye, Clock, ShieldCheck, ArrowRight, Zap, Radio, Calendar, Search } from 'lucide-react';
import useAppStore from '../../store/appStore';
import { useWeather } from '../../hooks/useWeather';
import { calculateComfortScore } from '../../lib/comfortEngine';
import { evaluateTimeline, getRiskDisplay } from '../../lib/riskEngine';
import { ACTIVITIES } from '../../lib/activityConfig';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function HomeScreen() {
  const currentWeather = useAppStore((s) => s.currentWeather);
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const location = useAppStore((s) => s.location);
  const userType = useAppStore((s) => s.userType);
  const personalPreferences = useAppStore((s) => s.personalPreferences);
  const selectedActivity = useAppStore((s) => s.selectedActivity) || 'bike_ride';
  const setSelectedActivity = useAppStore((s) => s.setSelectedActivity);
  const setScreen = useAppStore((s) => s.setScreen);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setRouteMode = useAppStore((s) => s.setRouteMode);

  const { loading } = useWeather();

  const activity = ACTIVITIES[selectedActivity] || ACTIVITIES.bike_ride;

  // Calculate Personal Comfort Score
  const comfort = calculateComfortScore(currentWeather || forecastBlocks[0], personalPreferences);

  // Calculate Today's Risk & Verdict
  const blocks = forecastBlocks.slice(0, 8);
  const evaluation = blocks.length
    ? evaluateTimeline(blocks, selectedActivity, location?.terrain || 'plains')
    : null;

  const riskLevel = evaluation?.overall?.riskLevel || 'SAFE';
  const riskDisplay = getRiskDisplay(riskLevel);

  const handleAction = (tab, screen, route = false) => {
    if (route) setRouteMode('route');
    else setRouteMode('point');
    setActiveTab(tab);
    setScreen(screen);
  };

  // Quick Weather Insight segments (Morning, Afternoon, Evening, Night)
  const getInsightSegment = (hourRange, defaultTemp, label, icon) => {
    const matchingBlock = forecastBlocks.find((b) => {
      const dt = new Date((b.dt || 0) * 1000);
      const h = dt.getHours();
      return h >= hourRange[0] && h <= hourRange[1];
    }) || forecastBlocks[0];

    const temp = matchingBlock?.temp ? Math.round(matchingBlock.temp) : defaultTemp;
    const rain = matchingBlock?.rainProbability ?? 10;
    const risk = rain > 60 ? 'HIGH_RISK' : rain > 30 ? 'MODERATE' : 'SAFE';
    const display = getRiskDisplay(risk);

    return {
      label,
      icon,
      temp,
      rain,
      riskLabel: display.label,
      riskColor: display.color,
      bgColor: display.bgColor,
    };
  };

  const insights = [
    getInsightSegment([6, 11], 27, 'Morning', '☀️'),
    getInsightSegment([12, 16], 32, 'Afternoon', '🌤️'),
    getInsightSegment([17, 21], 28, 'Evening', '🌧️'),
    getInsightSegment([22, 23], 25, 'Night', '🌙'),
  ];

  return (
    <div className="pb-28 space-y-8 px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
      {/* 1. Hero Weather Atmosphere Banner */}
      {loading && !currentWeather ? (
        <div className="bg-white rounded-3xl p-12 flex justify-center border border-slate-200 shadow-xs">
          <LoadingSpinner size="md" label="Loading live atmospheric telemetry..." />
        </div>
      ) : (
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-sky-900/10 animate-gradient-shift"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Subtle Ambient Background Flare */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Header: Location & Zone */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
                <MapPin size={14} className="text-sky-200" />
                <span className="font-extrabold">{currentWeather?.name || location?.name || 'Coimbatore'}</span>
                <span className="text-sky-200 font-normal">({location?.zone || 'Tamil Nadu'})</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md uppercase tracking-wider">
                  Live Radar Feed
                </span>
                <span className="text-xs text-sky-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md font-medium">
                  Persona: {userType?.toUpperCase() || 'GENERAL'}
                </span>
              </div>
            </div>

            {/* Core Temp & Description */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-6">
              <div className="flex items-baseline gap-4">
                <span className="text-6xl sm:text-7xl font-black tracking-tight text-glow-white">
                  {currentWeather?.temp || 30}°C
                </span>
                <div>
                  <p className="text-xl font-extrabold text-sky-100 capitalize">
                    {currentWeather?.weatherDesc || 'Overcast Clouds'}
                  </p>
                  <p className="text-xs text-sky-200 mt-0.5">
                    Feels like {currentWeather?.feelsLike || 32}°C · Station Telemetry
                  </p>
                </div>
              </div>

              {/* Metric Pill Bar */}
              <div className="grid grid-cols-4 gap-3 bg-white/10 backdrop-blur-xl p-3.5 rounded-2xl border border-white/15 shadow-inner min-w-[280px]">
                <div className="space-y-0.5 text-center">
                  <div className="text-[10px] text-sky-200 font-semibold uppercase">Rain</div>
                  <div className="text-sm font-extrabold">{currentWeather?.rainProbability ?? 20}%</div>
                </div>
                <div className="space-y-0.5 text-center border-l border-white/15">
                  <div className="text-[10px] text-sky-200 font-semibold uppercase">Wind</div>
                  <div className="text-sm font-extrabold">{currentWeather?.windSpeed || 19} <span className="text-[10px] font-normal">km/h</span></div>
                </div>
                <div className="space-y-0.5 text-center border-l border-white/15">
                  <div className="text-[10px] text-sky-200 font-semibold uppercase">Humidity</div>
                  <div className="text-sm font-extrabold">{currentWeather?.humidity || 58}%</div>
                </div>
                <div className="space-y-0.5 text-center border-l border-white/15">
                  <div className="text-[10px] text-sky-200 font-semibold uppercase">Visib</div>
                  <div className="text-sm font-extrabold">{((currentWeather?.visibility || 10000) / 1000).toFixed(0)} <span className="text-[10px] font-normal">km</span></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2-Column Main Section: Comfort Score & Today's Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 2. Personal Comfort Score Card */}
        <motion.div
          className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              YOUR WEATHER TODAY
            </span>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
              Personal Preference Index
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 flex-shrink-0">
              <span className="text-3xl font-black">{comfort.score}</span>
              <span className="text-xs font-bold absolute bottom-2 text-sky-200">/ 10</span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">{comfort.rating}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">{comfort.reason}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Safety Verdict: <strong style={{ color: riskDisplay.color }}>{riskDisplay.label}</strong></span>
            <button
              onClick={() => handleAction('profile', null)}
              className="text-sky-600 font-bold hover:underline"
            >
              Tune Comfort Sliders →
            </button>
          </div>
        </motion.div>

        {/* 3. Today's Recommendation Card */}
        <motion.div
          className="lg:col-span-7 rounded-3xl p-6 border flex flex-col justify-between space-y-4 shadow-xs"
          style={{ backgroundColor: `${riskDisplay.color}08`, borderColor: `${riskDisplay.color}30` }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activity.icon}</span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  TODAY'S RECOMMENDATION
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">{activity.name}</h3>
              </div>
            </div>

            <div
              className="text-lg font-black px-4 py-1.5 rounded-xl uppercase tracking-wider"
              style={{ color: riskDisplay.color, backgroundColor: `${riskDisplay.color}20` }}
            >
              {riskDisplay.label}
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {riskLevel === 'SAFE'
              ? 'Favorable conditions expected for your activity window. Atmospheric parameters remain within safe limits.'
              : riskLevel === 'MODERATE'
              ? 'Rain probability increases later in the session. Plan for appropriate shelter or gear.'
              : 'Unfavorable weather conditions expected. Postponing outdoor activity is advised.'}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Clock size={14} className="text-sky-500" />
              <span>Recommended Start Window: <strong className="text-sky-700">04:30 PM – 05:45 PM</strong></span>
            </div>

            <button
              onClick={() => handleAction('planner', 'input')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-sm transition-all"
            >
              <span>Analyze Full Matrix</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 4. Quick Weather Insight Horizontal Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Quick Weather Insight</h3>
            <p className="text-xs text-slate-500">Daytime risk progression outlook</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Tamil Nadu Radar Grid</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {insights.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-2xl border flex flex-col justify-between space-y-2 transition-all hover:scale-[1.02]"
              style={{ backgroundColor: `${item.riskColor}08`, borderColor: `${item.riskColor}25` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-600">{item.label}</span>
                <span className="text-xl">{item.icon}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{item.temp}°C</span>
                <span className="text-xs font-bold" style={{ color: item.riskColor }}>
                  {item.riskLabel}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Rain chance: <strong className="text-slate-800">{item.rain}%</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Quick Actions Bar */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          QUICK ACTIONS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => handleAction('planner', 'input')}
            className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-lift hover:border-sky-300 transition-all space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Plan Activity</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Calendar & time picker</p>
            </div>
          </button>

          <button
            onClick={() => handleAction('planner', 'input', true)}
            className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-lift hover:border-sky-300 transition-all space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Check Route</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Multi-segment waypoints</p>
            </div>
          </button>

          <button
            onClick={() => handleAction('ai', 'ai_chat')}
            className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-lift hover:border-sky-300 transition-all space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Ask WeatherGPT</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Open-ended voice AI</p>
            </div>
          </button>

          <button
            onClick={() => handleAction('monitor', 'live_monitoring')}
            className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs card-hover-lift hover:border-sky-300 transition-all space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radio size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Live Monitor</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Continuous telemetry</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
