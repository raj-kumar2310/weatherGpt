'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Zap, ChevronRight, Wind, Droplets, Sun, Eye, X } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import { evaluateTimeline, getRiskDisplay } from '../../lib/riskEngine';
import { ACTIVITIES } from '../../lib/activityConfig';
import useAppStore from '../../store/appStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';

import { AICopilotChat } from '../ai/AICopilotChat';

const ACTIVITY_LIST = Object.values(ACTIVITIES);

const CATEGORIES = [
  { id: 'all', label: 'All Activities', icon: '✨' },
  { id: 'sports', label: 'Sports & Outdoors', icon: '🚴', ids: ['bike_ride', 'picnic'] },
  { id: 'agriculture', label: 'Agriculture', icon: '🌾', ids: ['farming'] },
  { id: 'travel', label: 'Travel & Routes', icon: '🚗', ids: ['travel'] },
  { id: 'events', label: 'Events & Venues', icon: '🎪', ids: ['outdoor_event'] },
  { id: 'coastal', label: 'Coastal & Fishing', icon: '🎣', ids: ['fishing'] },
];

function ActivityCard({ activity, riskLevel, insight, onSelect }) {
  const display = getRiskDisplay(riskLevel);
  const badgeVariant = riskLevel === 'SAFE' ? 'go' : riskLevel === 'MODERATE' ? 'caution' : 'avoid';

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-sky-300 transition-all duration-300 overflow-hidden flex flex-col justify-between"
    >
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: `${activity.color}15`, border: `1.5px solid ${activity.color}35` }}
            >
              {activity.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-sky-600 transition-colors">
                {activity.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{activity.subtitle}</p>
            </div>
          </div>
          <Badge variant={badgeVariant} size="sm">{display.label}</Badge>
        </div>

        {/* Insight text */}
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {insight}
        </p>
      </div>

      {/* Action Strip */}
      <div
        className="px-5 py-3 flex items-center justify-between gap-2 border-t transition-colors"
        style={{ backgroundColor: `${display.color}08`, borderColor: `${display.color}20` }}
      >
        <span className="text-xs font-bold" style={{ color: display.textColor }}>
          Evaluate Safety Matrix
        </span>
        <ChevronRight size={15} style={{ color: display.color }} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

function WeatherSummaryBar({ weather, location }) {
  if (!weather) return null;

  const stability =
    weather.humidity > 85 ? { label: 'UNSTABLE ATMOSPHERE', color: 'bg-red-500/20 text-red-100 border-red-400/40' } :
    weather.humidity > 65 ? { label: 'VARIABLE ATMOSPHERE', color: 'bg-amber-500/20 text-amber-100 border-amber-400/40' } :
                            { label: 'STABLE ATMOSPHERE', color: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40' };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-sky-900/10">
      {/* Background flare */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Location & Main Temp */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <MapPin size={13} className="text-sky-200" />
              <span>{weather.name || location?.name}</span>
              <span className="text-sky-200">({location?.zone || 'Tamil Nadu'})</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-md ${stability.color}`}>
              {stability.label}
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-5xl sm:text-6xl font-black tracking-tight">{weather.temp}°C</span>
            <div>
              <p className="text-lg font-bold text-sky-100 capitalize">{weather.weatherDesc}</p>
              <p className="text-xs text-sky-200">Feels like {weather.feelsLike || weather.temp}°C · Tamil Nadu Radar</p>
            </div>
          </div>
        </div>

        {/* Right Column: Grid metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/15">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sky-200 text-xs font-medium">
              <Wind size={13} /> Wind
            </div>
            <p className="text-base font-bold">{weather.windSpeed} <span className="text-xs font-normal text-sky-200">km/h</span></p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sky-200 text-xs font-medium">
              <Droplets size={13} /> Humidity
            </div>
            <p className="text-base font-bold">{weather.humidity} <span className="text-xs font-normal text-sky-200">%</span></p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sky-200 text-xs font-medium">
              <Eye size={13} /> Visib.
            </div>
            <p className="text-base font-bold">{((weather.visibility || 10000) / 1000).toFixed(1)} <span className="text-xs font-normal text-sky-200">km</span></p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sky-200 text-xs font-medium">
              <Sun size={13} /> AQI
            </div>
            <p className="text-base font-bold">{weather.aqi || 82} <span className="text-xs font-normal text-emerald-300">(Good)</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivitySelection() {
  const setSelectedActivity = useAppStore((s) => s.setSelectedActivity);
  const setScreen = useAppStore((s) => s.setScreen);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const currentWeather = useAppStore((s) => s.currentWeather);
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const location = useAppStore((s) => s.location);
  const { loading } = useWeather();

  const [viewMode, setViewMode] = useState('copilot'); // 'copilot' | 'presets'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Compute quick risk per activity from first 4 forecast blocks
  const activityRisks = ACTIVITY_LIST.reduce((acc, act) => {
    if (forecastBlocks.length === 0) {
      acc[act.id] = { riskLevel: 'SAFE', insight: 'Loading weather data…' };
      return acc;
    }
    const blocks = forecastBlocks.slice(0, 4);
    const result = evaluateTimeline(blocks, act.id, location?.terrain || 'plains');
    const { overall } = result;
    const display = getRiskDisplay(overall.riskLevel);

    const insights = {
      SAFE: {
        bike_ride:     'Clear roads, mild wind. Great time to ride.',
        picnic:        'Sunny skies expected. Perfect for outdoor dining.',
        farming:       'Low rain risk. Ideal for spraying & irrigation.',
        travel:        'Mountain passes clear. Good visibility.',
        outdoor_event: 'Stable conditions for setup and gathering.',
        fishing:       'Calm waters. Good catch window ahead.',
      },
      MODERATE: {
        bike_ride:     'Some wind gusts. Use caution on open stretches.',
        picnic:        'Carry rain cover — showers possible by afternoon.',
        farming:       'Avoid spraying after 2 PM. Wind drift risk.',
        travel:        'Ghat roads may get slippery. Drive carefully.',
        outdoor_event: 'Rain risk at 4 PM. Tent cover advised.',
        fishing:       'Swell rising. Return before noon advised.',
      },
      HIGH_RISK: {
        bike_ride:     'Heavy rain & gusty winds. Postpone ride.',
        picnic:        'Wet conditions all day. Indoor plan needed.',
        farming:       'Waterlogging risk. Suspend field operations.',
        travel:        'Landslide risk on ghats. Avoid travel.',
        outdoor_event: 'Continuous rain. Move event indoors now.',
        fishing:       'Rough seas. Do not venture offshore.',
      },
    };

    acc[act.id] = {
      riskLevel: overall.riskLevel,
      insight: insights[overall.riskLevel]?.[act.id] || display.label,
    };
    return acc;
  }, {});

  const handleActivitySelect = (activityId) => {
    setSelectedActivity(activityId);
    setActiveTab('planner');
    setScreen('input');
  };

  // Filter activities dynamically by search query and category
  const filteredActivities = ACTIVITY_LIST.filter((act) => {
    const matchesSearch =
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryObj = CATEGORIES.find((c) => c.id === selectedCategory);
    const matchesCategory =
      selectedCategory === 'all' || (categoryObj && categoryObj.ids?.includes(act.id));

    return matchesSearch && matchesCategory;
  });

  const goCount   = ACTIVITY_LIST.filter((a) => activityRisks[a.id]?.riskLevel === 'SAFE').length;
  const holdCount = ACTIVITY_LIST.filter((a) => activityRisks[a.id]?.riskLevel === 'MODERATE').length;
  const avoidCount = ACTIVITY_LIST.filter((a) => activityRisks[a.id]?.riskLevel === 'HIGH_RISK').length;

  return (
    <div className="pb-28 space-y-8 px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
      {/* Hero Weather Summary */}
      {loading && !currentWeather ? (
        <div className="bg-sky-50 rounded-3xl p-8 flex justify-center border border-sky-100 shadow-sm">
          <LoadingSpinner size="md" label="Analyzing Tamil Nadu micro-zones…" />
        </div>
      ) : (
        <WeatherSummaryBar weather={currentWeather} location={location} />
      )}

      {/* Main AI Assistant Interface */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>🤖</span>
            <span>WeatherAction AI Assistant</span>
          </h2>
          <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
            Powered by Tamil Nadu Risk Engine v2.4
          </span>
        </div>
        <AICopilotChat />
      </div>

      {/* Preset Activity Shortcuts Grid */}
      <div className="space-y-5 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>⚡</span>
              <span>Quick Preset Activity Cards</span>
            </h3>
            <p className="text-xs text-slate-500">Instant one-click weather decision matrices for popular Tamil Nadu preset activities</p>
          </div>

          {/* Live Risk Badges Count */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-100/80 border border-slate-200/60 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Risks:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{goCount} GO</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{holdCount} HOLD</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{avoidCount} ALERT</span>
            </div>
          </div>
        </div>

        {/* Live Search & Category Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="activity-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity presets (e.g., Bike ride, Farming, Ghat travel, Picnic)..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-slate-200/80 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 scale-[1.02]'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Grid */}
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="font-bold text-slate-800">No preset activities match "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 mt-1">Ask the AI Assistant above or try searching for bike, farming, travel, or fishing.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-50 text-sky-600 font-bold text-xs hover:bg-sky-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredActivities.map((activity, i) => {
              const { riskLevel, insight } = activityRisks[activity.id] || {};
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <ActivityCard
                    activity={activity}
                    riskLevel={riskLevel || 'SAFE'}
                    insight={insight || ''}
                    onSelect={() => handleActivitySelect(activity.id)}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision Engine Status Banner */}
      <motion.div
        className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-sky-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">Hyperlocal Risk Engine v2.4</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                  Active Radar
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluates 5 weighted vectors: Rain (35%) · Wind (25%) · Visibility (15%) · Humidity (15%) · UV (10%)
              </p>
            </div>
          </div>
          <div className="text-right sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
            <span className="text-xs text-sky-300 font-semibold block">📍 {location?.zone || 'Coimbatore Basin'}</span>
            <span className="text-xs text-slate-400 capitalize">Terrain profile: {location?.terrain || 'plains'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

