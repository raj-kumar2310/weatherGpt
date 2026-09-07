'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, ShieldAlert, ArrowRight, Wind, Droplets, Mountain } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 uppercase tracking-wider">
            Interactive Route Radar
          </span>
          <h3 className="font-extrabold text-slate-900 text-base mt-1">
            {origin?.name || 'Origin'} → {destination?.name || 'Destination'} Route Breakdown
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />GO</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />CAUTION</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />AVOID</span>
        </div>
      </div>

      {/* Worst-risk segment alert card */}
      {worstWp && worstWp.scored?.riskLevel === 'HIGH_RISK' && (
        <motion.div
          className="rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
            🚨
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-red-700 tracking-wider">
                Highest Risk Corridor Segment
              </span>
              <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                Score: {worstWp.scored?.totalScore}/100
              </span>
            </div>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
              {worstWp.name} ({worstWp.terrain || 'Mountain Pass'})
            </p>
            <p className="text-xs text-red-800 mt-1">
              Rain probability {worstWp.forecastBlocks?.[0]?.rainProbability || 60}% with wind gusts {Math.round(worstWp.forecastBlocks?.[0]?.windSpeed || 35)} km/h. Exercise extreme caution in this segment.
            </p>
          </div>
        </motion.div>
      )}

      {/* Route vector map canvas */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-6 text-white overflow-hidden shadow-inner min-h-[220px]">
        {/* Background contour lines styling */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#0EA5E9_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* SVG Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <path
            d="M 50 140 Q 150 60, 250 120 T 450 80 T 650 130"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="4"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        </svg>

        {/* Interactive Waypoint Nodes Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {waypoints.map((wp, idx) => {
            const isSelected = activeWp?.name === wp.name;
            const wpDisplay = getRiskDisplay(wp.scored?.riskLevel || 'SAFE');

            return (
              <motion.button
                key={wp.name || idx}
                onClick={() => setSelectedWp(wp)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden backdrop-blur-md ${
                  isSelected
                    ? 'ring-2 ring-sky-400 bg-slate-800/90 shadow-xl scale-[1.03]'
                    : 'bg-slate-900/60 border-slate-700/80 hover:bg-slate-800/80'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-400">Pt {idx + 1}</span>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: wpDisplay.bgColor, color: wpDisplay.textColor }}
                  >
                    {wpDisplay.label}
                  </span>
                </div>

                <div className="font-extrabold text-sm text-white truncate">{wp.name}</div>
                <div className="text-[11px] text-sky-300 capitalize flex items-center gap-1 mt-0.5">
                  {wp.terrain === 'hills' ? <Mountain size={11} /> : <MapPin size={11} />}
                  <span>{wp.terrain || 'Plains'}</span>
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

        {/* Selected Waypoint Detail Bar */}
        <AnimatePresence mode="wait">
          {activeWp && (
            <motion.div
              key={activeWp.name}
              className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: activeDisplay.bgColor, color: activeDisplay.textColor }}>
                  {activeDisplay.label}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-white">{activeWp.name} Corridor Details</div>
                  <p className="text-slate-400 text-[11px]">Risk Index: {activeWp.scored?.totalScore || 0} / 100 · Terrain: {activeWp.terrain || 'plains'}</p>
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
