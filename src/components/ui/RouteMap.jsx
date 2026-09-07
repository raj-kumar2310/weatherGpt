'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, ShieldAlert, ArrowRight, Wind, Droplets, Mountain, Eye, Clock } from 'lucide-react';
import { getRiskDisplay } from '../../lib/riskEngine';

export function RouteMap({ waypoints = [], origin, destination }) {
  const [selectedWp, setSelectedWp] = useState(null);

  if (!waypoints || waypoints.length === 0) return null;

  // Find worst risk segment
  const worstWp = waypoints.reduce((worst, wp) => {
    const score = wp.scored?.totalScore || 0;
    return score > (worst.scored?.totalScore || 0) ? wp : worst;
  }, waypoints[0]);

  const activeWp = selectedWp || worstWp;
  const activeDisplay = getRiskDisplay(activeWp?.scored?.riskLevel || 'SAFE');

  const cautionCount = waypoints.filter((w) => w.scored?.riskLevel === 'MODERATE').length;
  const avoidCount = waypoints.filter((w) => w.scored?.riskLevel === 'HIGH_RISK').length;

  const worstDisplay = getRiskDisplay(worstWp?.scored?.riskLevel || 'SAFE');

  // Combined Route Risk Summary Text
  let summaryText = `All ${waypoints.length} route segments show GO — Favorable weather along entire corridor.`;
  if (avoidCount > 0) {
    summaryText = `${avoidCount} of ${waypoints.length} segments show AVOID — Mountain section near ${worstWp.name} has highest risk.`;
  } else if (cautionCount > 0) {
    summaryText = `${cautionCount} of ${waypoints.length} segments show CAUTION — Ghat section near ${worstWp.name} has highest risk.`;
  }

  // Pre-calculated ETAs and distances for checkpoints
  const checkpointMeta = [
    { distance: '0 km', eta: 'Start' },
    { distance: '24 km', eta: '+25 mins' },
    { distance: '58 km', eta: '+50 mins' },
    { distance: '86 km', eta: '+1h 20m' },
    { distance: '112 km', eta: '+1h 45m' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 uppercase tracking-wider">
            Route Segment Risk Breakdown
          </span>
          <h3 className="font-extrabold text-slate-900 text-base mt-1">
            {origin?.name || 'Origin'} → {destination?.name || 'Destination'} Route Checkpoints
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />GO</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />CAUTION</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />AVOID</span>
        </div>
      </div>

      {/* 1. Combined Route Risk Summary Banner */}
      <motion.div
        className="rounded-2xl p-4 border flex items-center gap-3.5 shadow-2xs"
        style={{ backgroundColor: `${worstDisplay.color}10`, borderColor: `${worstDisplay.color}35` }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm"
          style={{ backgroundColor: worstDisplay.color, color: '#ffffff' }}
        >
          {worstDisplay.label === 'SAFE' ? '✓' : worstDisplay.label === 'CAUTION' ? '⚠️' : '🚨'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: worstDisplay.color }}>
              Combined Route Risk Summary
            </span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-md" style={{ backgroundColor: `${worstDisplay.color}20`, color: worstDisplay.color }}>
              Worst Segment: {worstDisplay.label} ({worstWp.scored?.totalScore || 0}/100)
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
            {summaryText}
          </p>
        </div>
      </motion.div>

      {/* 2. Route Checkpoint Mini Risk Cards Grid */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-5 text-white overflow-hidden shadow-inner space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700/80 pb-2">
          <span className="font-extrabold text-sky-400">Route Checkpoints ({waypoints.length} Segments)</span>
          <span>Click any checkpoint card to inspect corridor telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {waypoints.map((wp, idx) => {
            const isSelected = activeWp?.name === wp.name;
            const wpDisplay = getRiskDisplay(wp.scored?.riskLevel || 'SAFE');
            const meta = checkpointMeta[idx] || { distance: `${(idx + 1) * 25} km`, eta: `+${(idx + 1) * 30}m` };

            const rain = wp.forecastBlocks?.[0]?.rainProbability ?? 10;
            const wind = Math.round(wp.forecastBlocks?.[0]?.windSpeed ?? 12);
            const vis = ((wp.forecastBlocks?.[0]?.visibility ?? 10000) / 1000).toFixed(1);

            return (
              <motion.button
                key={wp.name || idx}
                onClick={() => setSelectedWp(wp)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden backdrop-blur-md flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-sky-400 bg-slate-800/90 shadow-xl scale-[1.02]'
                    : 'bg-slate-900/70 border-slate-700/80 hover:bg-slate-800/80'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400">Pt {idx + 1} · {meta.eta}</span>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
                      style={{ backgroundColor: wpDisplay.bgColor, color: wpDisplay.textColor }}
                    >
                      {wpDisplay.label}
                    </span>
                  </div>

                  <div className="font-extrabold text-sm text-white truncate">{wp.name}</div>
                  <div className="text-[11px] text-sky-300 capitalize flex items-center gap-1 mt-0.5">
                    {wp.terrain === 'hills' ? <Mountain size={11} /> : <MapPin size={11} />}
                    <span>{wp.terrain || 'Plains'}</span>
                    <span className="text-slate-500">· {meta.distance}</span>
                  </div>
                </div>

                {/* Top 1-2 Risk Reasons */}
                <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] space-y-0.5 text-slate-300 font-medium">
                  <div className="flex items-center justify-between">
                    <span>🌧️ Rain prob:</span>
                    <strong className={rain > 50 ? 'text-amber-400' : 'text-slate-200'}>{rain}%</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>💨 Wind speed:</span>
                    <strong className={wind > 30 ? 'text-amber-400' : 'text-slate-200'}>{wind} km/h</strong>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-2.5 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, wp.scored?.totalScore || 0)}%`,
                      backgroundColor: wpDisplay.color,
                    }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Waypoint Corridor Telemetry Detail */}
        <AnimatePresence mode="wait">
          {activeWp && (
            <motion.div
              key={activeWp.name}
              className="bg-slate-800/95 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-inner" style={{ backgroundColor: activeDisplay.bgColor, color: activeDisplay.textColor }}>
                  {activeDisplay.label}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-white">{activeWp.name} Corridor Details</div>
                  <p className="text-slate-400 text-[11px]">Risk Index: {activeWp.scored?.totalScore || 0} / 100 · Profile: {activeWp.terrain || 'plains'}</p>
                </div>
              </div>

              <div className="flex gap-4 text-slate-300 font-medium border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700 w-full sm:w-auto justify-around">
                <span className="flex items-center gap-1"><Droplets size={13} className="text-sky-400" /> {activeWp.forecastBlocks?.[0]?.rainProbability || 10}% Rain</span>
                <span className="flex items-center gap-1"><Wind size={13} className="text-sky-400" /> {Math.round(activeWp.forecastBlocks?.[0]?.windSpeed || 12)} km/h</span>
                <span className="text-sky-400 font-bold">{activeWp.forecastBlocks?.[0]?.temp || 28}°C</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
