'use client';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TimelineBlock — a single hour-block in the timeline bar.
 * Shows color based on risk level, with tooltip on hover.
 */
export function TimelineBlock({ block, index = 0, compact = false }) {
  const time = block.time instanceof Date ? block.time : new Date((block.dt || 0) * 1000);
  const hour = time.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  const colorMap = {
    SAFE:      { bg: 'bg-emerald-400', hover: 'hover:bg-emerald-500', border: 'border-emerald-500' },
    MODERATE:  { bg: 'bg-amber-400',   hover: 'hover:bg-amber-500',   border: 'border-amber-500' },
    HIGH_RISK: { bg: 'bg-red-400',     hover: 'hover:bg-red-500',     border: 'border-red-500' },
  };

  const colors = colorMap[block.riskLevel] || colorMap.SAFE;

  return (
    <div className="relative group flex-1 min-w-0">
      <motion.div
        className={`${colors.bg} ${colors.hover} ${compact ? 'h-8' : 'h-12'} rounded cursor-pointer transition-colors relative overflow-hidden`}
        initial={{ scaleY: 0, opacity: 0, originY: 1 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: index * 0.04, duration: 0.4, ease: 'easeOut' }}
        whileHover={{ scaleY: 1.1 }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </motion.div>

      {/* Time label */}
      {!compact && (
        <div className="text-center mt-1 text-xs text-slate-500 font-medium whitespace-nowrap">
          {hour12}{ampm}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover:block pointer-events-none">
        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl min-w-[120px] text-center">
          <div className="font-bold mb-1">{hour12}:00 {ampm}</div>
          <div>🌧️ Rain: {block.rainProbability ?? 0}%</div>
          <div>💨 Wind: {Math.round(block.windSpeed ?? 0)} km/h</div>
          <div>💧 Hum: {block.humidity ?? 0}%</div>
          <div className="mt-1 font-semibold" style={{
            color: block.riskLevel === 'SAFE' ? '#10B981' : block.riskLevel === 'MODERATE' ? '#F59E0B' : '#EF4444'
          }}>
            {block.riskLevel === 'SAFE' ? '✓ GO' : block.riskLevel === 'MODERATE' ? '⚠ CAUTION' : '✗ AVOID'}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline — renders a row of TimelineBlocks.
 */
export function Timeline({ blocks = [], compact = false }) {
  // Show max 12 blocks
  const shown = blocks.slice(0, 12);

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {shown.map((block, i) => (
          <TimelineBlock key={block.dt || i} block={block} index={i} compact={compact} />
        ))}
      </div>
      {!compact && (
        <div className="flex justify-between text-xs text-slate-400 px-0.5">
          <span>Now</span>
          <span>+12h</span>
        </div>
      )}
    </div>
  );
}
