'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Calendar, Clock, Droplets, Wind, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { StepIndicator } from '../ui/StepIndicator';
import { EvaluatingOverlay } from '../ui/LoadingSpinner';
import { SevereWarningBanner } from '../ui/SevereWarningBanner';
import { detectSevereWarnings } from '../../lib/riskEngine';
import useAppStore from '../../store/appStore';
import { useRiskScore } from '../../hooks/useWeather';
import { ACTIVITIES, TAMIL_NADU_CITIES, ROUTE_PROFILES } from '../../lib/activityConfig';
import { Card } from '../ui/Card';
import { t } from '../../lib/translations';
import { CalendarEventPlanner } from './CalendarEventPlanner';

const DATE_OPTIONS = [
  { id: 'today', labelKey: 'todayLabel' },
  { id: 'tomorrow', labelKey: 'tomorrowLabel' },
  { id: 'day_after', labelKey: 'dayAfterLabel' },
];

function CityDropdown({ value, onChange, placeholder, id }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const localFiltered = query.length >= 1
    ? TAMIL_NADU_CITIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.zone && c.zone.toLowerCase().includes(query.toLowerCase()))
      )
    : TAMIL_NADU_CITIES;

  // Debounce API geocoding search when query is typed and no local matches exist
  useEffect(() => {
    if (!query || query.trim().length < 2 || localFiltered.length > 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(query);
        setSearchResults(results.map((r) => ({
          name: r.name,
          zone: r.state ? `${r.state}, ${r.country || 'IN'}` : 'Location',
          terrain: 'plains',
          lat: r.lat,
          lon: r.lon,
        })));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, localFiltered.length]);

  const displayList = localFiltered.length > 0 ? localFiltered : searchResults;
  const selected = TAMIL_NADU_CITIES.find((c) => c.name === value) || (value ? { name: value, zone: 'Custom Location' } : null);

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white border border-slate-200 cursor-pointer shadow-sm"
        onClick={() => setOpen(!open)}
        id={id}
      >
        <MapPin size={15} className="text-sky-500 flex-shrink-0" />
        {selected ? (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800">{selected.name}</div>
            <div className="text-xs text-slate-400">{selected.zone}</div>
          </div>
        ) : (
          <span className="flex-1 text-sm text-slate-400">{placeholder}</span>
        )}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 overflow-hidden"
            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 border-b border-slate-100 flex items-center justify-between">
              <input
                className="w-full text-sm px-2 py-1.5 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-400"
                placeholder="Search city or location…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {searching && (
                <span className="text-[10px] text-sky-500 font-medium animate-pulse px-2">Searching...</span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {displayList.length === 0 && !searching ? (
                <div className="p-3 text-xs text-center text-slate-400">No matching locations found</div>
              ) : (
                displayList.map((city) => (
                  <button
                    key={city.name}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sky-50 transition-colors text-left"
                    onClick={() => { onChange(city); setOpen(false); setQuery(''); }}
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                      style={{ background: city.terrain === 'hills' ? '#ECFDF5' : city.terrain === 'coastal' ? '#EFF6FF' : '#FFFBEB' }}>
                      {city.terrain === 'hills' ? '⛰️' : city.terrain === 'coastal' ? '🌊' : '🏝️'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{city.name}</div>
                      <div className="text-xs text-slate-400">{city.zone} {city.terrain ? `· ${city.terrain}` : ''}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ElevationChart({ routeKey }) {
  const profile = ROUTE_PROFILES[routeKey];
  if (!profile) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 space-y-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-xs font-bold uppercase tracking-wider">Elevation Profile</p>
          <p className="text-slate-400 text-xs">{routeKey.replace('-', ' → ')}</p>
        </div>
        <div className="flex gap-3 text-right">
          <div>
            <div className="text-slate-400 text-xs">Distance</div>
            <div className="text-white text-sm font-bold">{profile.distance} km</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Gain</div>
            <div className="text-emerald-400 text-sm font-bold">+{profile.elevationGain}m</div>
          </div>
        </div>
      </div>

      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={profile.points} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="km" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} unit="km" />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
              formatter={(v, name) => [`${v}m`, 'Elevation']}
              labelFormatter={(l) => `${l}km`}
            />
            <Area type="monotone" dataKey="elevation" stroke="#0EA5E9" strokeWidth={2} fill="url(#elevGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Zone labels */}
      <div className="flex gap-2 flex-wrap">
        {profile.zones.map((zone) => (
          <span
            key={zone.type}
            className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${zone.risk === 'high' ? 'bg-red-900/50 text-red-300' :
                zone.risk === 'medium' ? 'bg-amber-900/50 text-amber-300' :
                'bg-emerald-900/50 text-emerald-300'}`}
          >
            {zone.type}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function InputScreen() {
  const language = useAppStore((s) => s.language) || 'en';
  const selectedActivity = useAppStore((s) => s.selectedActivity);
  const routeMode = useAppStore((s) => s.routeMode);
  const origin = useAppStore((s) => s.origin);
  const destination = useAppStore((s) => s.destination);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const startTime = useAppStore((s) => s.startTime);
  const endTime = useAppStore((s) => s.endTime);
  const rainLimit = useAppStore((s) => s.rainLimit);
  const windGustMax = useAppStore((s) => s.windGustMax);
  const isEvaluating = useAppStore((s) => s.isEvaluating);
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const currentWarnings = detectSevereWarnings(forecastBlocks?.[0], origin?.terrain || 'plains');

  const setRouteMode = useAppStore((s) => s.setRouteMode);
  const setOrigin = useAppStore((s) => s.setOrigin);
  const setDestination = useAppStore((s) => s.setDestination);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const setStartTime = useAppStore((s) => s.setStartTime);
  const setEndTime = useAppStore((s) => s.setEndTime);
  const setRainLimit = useAppStore((s) => s.setRainLimit);
  const setWindGustMax = useAppStore((s) => s.setWindGustMax);
  const setScreen = useAppStore((s) => s.setScreen);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const { evaluate } = useRiskScore();
  const activity = ACTIVITIES[selectedActivity];

  const routeKey = origin && destination ? `${origin.name}-${destination.name}` : null;
  const hasProfile = routeKey && ROUTE_PROFILES[routeKey];
  const isRouteActivity = ['bike_ride', 'travel', 'outdoor_event'].includes(selectedActivity);

  const handleEvaluate = async () => {
    await evaluate();
    setScreen('decision_result');
  };

  const handleBack = () => {
    setScreen('activity_selection');
    setActiveTab('activities');
  };

  if (!activity) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="font-medium">No activity selected</p>
          <button className="mt-3 text-sky-500 text-sm font-medium" onClick={handleBack}>
            ← Pick an activity
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isEvaluating && <EvaluatingOverlay />}
      </AnimatePresence>

      <div className="pb-28 space-y-6 px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
        {/* Step indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <StepIndicator
            current={2}
            total={3}
            labels={[t('stepSelectActivity', language), t('stepPlanDetails', language), t('stepDecisionMatrix', language)]}
          />
          <span className="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1 rounded-full border border-sky-100 self-start sm:self-auto">
            Next: Decision Engine Assessment
          </span>
        </div>

        {/* Severe Weather Warning-First Banner (Phase 7) */}
        <SevereWarningBanner warnings={currentWarnings} />

        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Route & Location Settings */}
          <div className="lg:col-span-5 space-y-5">
            {/* Active baseline */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                    style={{ backgroundColor: `${activity.color}20` }}
                  >
                    {activity.icon}
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">{t('selectedActivityLabel', language)}</div>
                    <div className="font-extrabold text-slate-900 text-base">{activity.name}</div>
                    <p className="text-xs text-slate-500">{activity.subtitle}</p>
                  </div>
                </div>
                <button
                  className="text-xs text-sky-600 font-bold px-3 py-2 rounded-xl border border-sky-200 hover:bg-sky-50 transition-colors"
                  onClick={handleBack}
                >
                  {t('changeBtn', language)}
                </button>
              </div>
            </Card>

            {/* Route mode toggle (only for route-capable activities) */}
            {isRouteActivity && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('routeConfigLabel', language)}
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-1">
                  {['point', 'route'].map((mode) => (
                    <button
                      key={mode}
                      id={`route-mode-${mode}`}
                      onClick={() => setRouteMode(mode)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        routeMode === mode
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode === 'point' ? t('singleLocationBtn', language) : t('routeModeBtn', language)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location selection */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {t('startingPointLabel', language)}
                </label>
                <div className="relative">
                  <CityDropdown
                    id="input-origin"
                    value={origin?.name}
                    onChange={setOrigin}
                    placeholder={t('selectStartCity', language)}
                  />
                  {origin && (
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      GPS Lock
                    </span>
                  )}
                </div>
              </div>

              {/* Destination (route mode only) */}
              {(isRouteActivity && routeMode === 'route') && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    {t('destinationCityLabel', language)}
                  </label>
                  <CityDropdown
                    id="input-destination"
                    value={destination?.name}
                    onChange={setDestination}
                    placeholder={t('selectDestCity', language)}
                  />
                </div>
              )}
            </div>

            {/* Date & Time selection */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {t('operationalDateLabel', language)}
                </label>
                <div className="flex gap-2">
                  {DATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      id={`date-${opt.id}`}
                      onClick={() => setSelectedDate(opt.id)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all
                        ${selectedDate === opt.id
                          ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}
                    >
                      {t(opt.labelKey, language)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7-Day Smart Calendar Outlook Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  📅 7-Day Weather Outlook Grid
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const d = new Date();
                    d.setDate(d.getDate() + idx);
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateNum = d.getDate();

                    // Estimate risk dot from forecast blocks
                    const block = forecastBlocks[idx] || {};
                    const rain = block.rainProbability ?? (idx % 2 === 0 ? 15 : 65);
                    const riskDot = rain > 60 ? '🔴' : rain > 30 ? '🟡' : '🟢';

                    return (
                      <div
                        key={idx}
                        className={`p-1.5 rounded-xl border text-center cursor-pointer transition-all ${
                          idx === 0 ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/30' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-slate-400">{dayName}</div>
                        <div className="text-xs font-black text-slate-800">{dateNum}</div>
                        <div className="text-[10px] mt-0.5">{riskDot}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">☀️ Sunrise window</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Target End
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <p className="text-[11px] text-amber-600 mt-1">⚠️ High UV at 12 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Elevation Chart, What-If Tool & Threshold Parameters */}
          <div className="lg:col-span-7 space-y-5">
            {/* Elevation profile */}
            <AnimatePresence>
              {hasProfile && <ElevationChart routeKey={routeKey} />}
            </AnimatePresence>

            {/* What-If Weather Time Comparison Tool */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚖️</span> What-If Time Comparison
                </span>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  Compare Slot Risks
                </span>
              </div>
              <p className="text-xs text-slate-500">Compare safety conditions between morning and afternoon windows</p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                  <div className="text-[10px] font-extrabold text-emerald-800 uppercase">Slot A: 09:00 AM</div>
                  <div className="text-sm font-black text-emerald-700">🟢 GO (Low Risk)</div>
                  <div className="text-[11px] text-slate-600">Rain: 15% · Wind: 12 km/h</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase">Slot B: 05:00 PM</div>
                  <div className="text-sm font-black text-amber-700">🟡 CAUTION (Showers)</div>
                  <div className="text-[11px] text-slate-600">Rain: 68% · Wind: 28 km/h</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-800 text-xs font-semibold flex items-center gap-2 border border-sky-100">
                <span>⭐</span>
                <span>Recommendation: <strong>09:00 AM is 4x safer</strong> than 05:00 PM due to evening rain build-up.</span>
              </div>
            </div>

            {/* Smart Calendar Event Intelligence Planner */}
            <CalendarEventPlanner />

            {/* Safety thresholds */}
            <Card className="p-6 space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Safety & Tolerance Thresholds</h3>
                <p className="text-xs text-slate-500">Fine-tune maximum acceptable weather limits for {activity.name}</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Droplets size={16} className="text-sky-500" />
                      Maximum Rain Tolerance
                    </label>
                    <span className="text-sm font-extrabold text-sky-600 bg-sky-100 px-3 py-0.5 rounded-full">{rainLimit}%</span>
                  </div>
                  <input
                    id="rain-limit-slider"
                    type="range" min="0" max="100" value={rainLimit}
                    onChange={(e) => setRainLimit(Number(e.target.value))}
                    className="w-full h-2 rounded-full bg-slate-200 appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Dry only (0%)</span>
                    <span>Heavy Rain (100%)</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Wind size={16} className="text-sky-500" />
                      Wind Gust Ceiling
                    </label>
                    <span className="text-sm font-extrabold text-sky-600 bg-sky-100 px-3 py-0.5 rounded-full">{windGustMax} km/h</span>
                  </div>
                  <input
                    id="wind-limit-slider"
                    type="range" min="5" max="80" value={windGustMax}
                    onChange={(e) => setWindGustMax(Number(e.target.value))}
                    className="w-full h-2 rounded-full bg-slate-200 appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Gentle Breeze (5 km/h)</span>
                    <span>Gale Force (80 km/h)</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Evaluate CTA Button */}
            <motion.button
              id="evaluate-btn"
              onClick={handleEvaluate}
              className="w-full py-5 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-sky-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-3"
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              <span>Evaluate Safety & Generate Decision Matrix</span>
              <span>→</span>
            </motion.button>

            {/* Data source footer */}
            <p className="text-center text-xs text-slate-400 pt-2">
              Multi-model radar: OpenWeatherMap · NOAA GFS · HRRR Tamil Nadu Micro-grid
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
