'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, WifiOff, Radio } from 'lucide-react';
import useAppStore from '../../store/appStore';
import { ACTIVITIES, PERSONA_RECOMMENDATIONS } from '../../lib/activityConfig';
import { evaluateTimeline, getRiskDisplay } from '../../lib/riskEngine';
import { Card } from '../ui/Card';
import { RiskBar } from '../ui/RiskBar';
import { Timeline } from '../ui/TimelineBlock';

const FACTOR_META = [
  { key: 'rain',       label: 'Rain Probability', icon: '🌧️', unit: '%' },
  { key: 'wind',       label: 'Wind Speed',       icon: '💨', unit: 'km/h' },
  { key: 'visibility', label: 'Visibility',       icon: '👁️', unit: 'm' },
  { key: 'humidity',   label: 'Humidity',         icon: '💧', unit: '%' },
  { key: 'uvIndex',    label: 'UV Index',         icon: '☀️', unit: '' },
];

function AlertBanner({ alert, onDismiss }) {
  const isHigh = alert?.severity === 'HIGH_RISK';

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          className={`fixed top-16 left-0 right-0 z-50 mx-4 rounded-2xl p-4 shadow-2xl
            ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            x: [0, -4, 4, -3, 3, -1, 1, 0],
          }}
          exit={{ y: -100, opacity: 0 }}
          transition={{
            y: { duration: 0.4, ease: 'easeOut' },
            x: { duration: 0.4, delay: 0.4 },
            opacity: { duration: 0.3 },
          }}
        >
          <div className="flex items-start gap-3">
            <motion.span
              className="text-xl flex-shrink-0"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              ⚠️
            </motion.span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Weather Alert</p>
              <p className="text-white/90 text-sm mt-0.5">{alert.message}</p>
            </div>
            <button
              onClick={onDismiss}
              className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LiveMetricRow({ blocks }) {
  if (!blocks?.length) return null;
  const b = blocks[0];

  const metrics = [
    { icon: '🌧️', label: 'Rain', value: b.rainProbability ?? 0, max: 100, unit: '%', danger: 60 },
    { icon: '💨', label: 'Wind', value: Math.round(b.windSpeed ?? 0), max: 80, unit: 'km/h', danger: 40 },
    { icon: '💧', label: 'Hum', value: b.humidity ?? 0, max: 100, unit: '%', danger: 85 },
    { icon: '☀️', label: 'UV', value: b.uvIndex ?? 0, max: 12, unit: '', danger: 8 },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {metrics.map((m) => {
        const danger = m.value >= m.danger;
        return (
          <div
            key={m.label}
            className={`rounded-xl p-2.5 text-center border
              ${danger ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}
          >
            <div className="text-lg mb-1">{m.icon}</div>
            <div className={`text-sm font-black ${danger ? 'text-red-600' : 'text-slate-800'}`}>
              {m.value}{m.unit}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{m.label}</div>
            <div className="mt-1.5 h-1 rounded-full bg-slate-200 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${danger ? 'bg-red-400' : 'bg-sky-400'}`}
                animate={{ width: `${Math.min(100, (m.value / m.max) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LiveMonitoring() {
  const selectedActivity = useAppStore((s) => s.selectedActivity);
  const userType = useAppStore((s) => s.userType);
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const location = useAppStore((s) => s.location);
  const weatherFromCache = useAppStore((s) => s.weatherFromCache);
  const weatherCacheAge = useAppStore((s) => s.weatherCacheAge);
  const simulatedAlert = useAppStore((s) => s.simulatedAlert);
  const triggerSimulation = useAppStore((s) => s.triggerSimulation);
  const simulationActive = useAppStore((s) => s.simulationActive);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [localAlert, setLocalAlert] = useState(null);

  const activity = ACTIVITIES[selectedActivity || 'bike_ride'];

  // Compute risk from current forecast blocks
  const terrain = location?.terrain || 'plains';
  const blocks = forecastBlocks.slice(0, 12);
  const riskData = blocks.length
    ? evaluateTimeline(blocks, selectedActivity || 'bike_ride', terrain)
    : null;

  const riskLevel = riskData?.overall?.riskLevel || 'SAFE';
  const display = getRiskDisplay(riskLevel);
  const factors = riskData?.overall?.factors || {};
  const weights = riskData?.overall?.weights || {};
  const scoredBlocks = riskData?.blocks || blocks.map((b) => ({ ...b, riskLevel: 'SAFE', time: new Date((b.dt || 0) * 1000) }));

  // Sync alert from store
  useEffect(() => {
    setLocalAlert(simulatedAlert);
  }, [simulatedAlert]);

  // Auto-refresh timestamp
  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = () => {
    triggerSimulation();
    setLastUpdated(new Date());
  };

  const userKey = userType || 'common_user';
  const recommendation = PERSONA_RECOMMENDATIONS[userKey]?.[riskLevel] || PERSONA_RECOMMENDATIONS.common_user[riskLevel];

  const timeSince = Math.round((Date.now() - lastUpdated.getTime()) / 60000);

  return (
    <>
      <AlertBanner alert={localAlert} onDismiss={() => setLocalAlert(null)} />

      <div className="pb-28 space-y-6 px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Atmospheric Monitoring</p>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <span>{activity?.icon}</span>
              <span>{activity?.name} Safety Radar</span>
            </h2>
            <p className="text-xs text-slate-500">Target Zone: {location?.name || 'Coimbatore'} · {location?.zone || 'Micro-zone'}</p>
          </div>

          {/* Last updated / cache indicator */}
          <div className="text-left sm:text-right">
            {weatherFromCache ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <WifiOff size={13} />
                <span>Cached Data ({weatherCacheAge}m ago)</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Live Feed · Updated {timeSince === 0 ? 'just now' : `${timeSince}m ago`}
              </div>
            )}
          </div>
        </div>

        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Big Status Banner, Timeline & Live Metrics */}
          <div className="lg:col-span-7 space-y-6">
            {/* Big status indicator */}
            <motion.div
              className="rounded-3xl p-8 text-center space-y-3 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${display.color}18, ${display.color}06)`, border: `2px solid ${display.color}40` }}
              animate={simulationActive ? {
                borderColor: ['#EF444440', '#EF4444', '#EF444440'],
              } : {}}
              transition={{ duration: 1, repeat: simulationActive ? Infinity : 0 }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Real-Time Risk Rating</p>
              <motion.div
                className="text-5xl sm:text-6xl font-black tracking-widest"
                style={{ color: display.color }}
                animate={simulationActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {display.label}
              </motion.div>
              <p className="text-base font-bold text-slate-800">{recommendation.title}</p>
            </motion.div>

            {/* Timeline */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Live Hourly Timeline</h3>
                  <p className="text-xs text-slate-400">Continuous telemetry feed</p>
                </div>
                <div className="flex items-center gap-1.5 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  <Radio size={13} className="text-sky-500" />
                  <span className="text-xs text-sky-700 font-bold">Auto-Syncing</span>
                </div>
              </div>
              <Timeline blocks={scoredBlocks} />
            </Card>

            {/* Live metrics */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Telemetry Metrics</h3>
              <LiveMetricRow blocks={forecastBlocks} />
            </div>
          </div>

          {/* Right Column: Advisory, Risk Breakdown & Simulation Trigger */}
          <div className="lg:col-span-5 space-y-6">
            {/* Persona Recommendation Advisory */}
            <div
              className="rounded-3xl p-6 space-y-3 shadow-xs"
              style={{ backgroundColor: `${display.color}12`, border: `1.5px solid ${display.color}35` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: display.color }}>
                  Live Persona Advisory
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${display.color}20`, color: display.color }}>
                  {userKey.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">{recommendation.body}</p>
              <div className="pt-2 border-t" style={{ borderColor: `${display.color}25` }}>
                <p className="text-xs font-bold" style={{ color: display.color }}>
                  📌 {recommendation.action}
                </p>
              </div>
            </div>

            {/* Risk factor bars */}
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Atmospheric Risk Breakdown</h3>
                <p className="text-xs text-slate-400">Live vector weight analysis</p>
              </div>
              <div className="space-y-3">
                {FACTOR_META.map(({ key, label, icon }) => (
                  <RiskBar
                    key={key}
                    label={label}
                    icon={icon}
                    score={factors[key] ?? 0}
                    weight={weights[key]}
                    animate={simulationActive}
                  />
                ))}
              </div>
            </Card>

            {/* Simulate button */}
            <div className="space-y-2">
              <motion.button
                id="simulate-weather-btn"
                onClick={handleSimulate}
                disabled={simulationActive}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-extrabold text-base shadow-md transition-all
                  ${simulationActive
                    ? 'border-red-300 bg-red-50 text-red-500 cursor-not-allowed'
                    : 'border-slate-200 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white hover:border-sky-400 hover:shadow-xl'}`}
                whileTap={simulationActive ? {} : { scale: 0.98 }}
              >
                <motion.span
                  animate={simulationActive ? { rotate: 360 } : {}}
                  transition={simulationActive ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}
                >
                  {simulationActive ? <RefreshCw size={18} /> : <Zap size={18} />}
                </motion.span>
                <span>{simulationActive ? 'Simulating Sudden Weather Deterioration…' : 'Simulate Sudden Weather Update'}</span>
              </motion.button>

              {simulationActive && (
                <motion.p
                  className="text-center text-xs text-red-500 font-bold"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ⚡ Simulated weather shift active — alert cascade triggered
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
