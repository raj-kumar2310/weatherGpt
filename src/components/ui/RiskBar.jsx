'use client';
import { motion } from 'framer-motion';

/**
 * RiskBar — horizontal bar showing a factor score 0-100
 * with color gradient and animated fill.
 */
export function RiskBar({ label, score = 0, weight, icon, animate = true }) {
  const color =
    score >= 65 ? '#EF4444' :
    score >= 35 ? '#F59E0B' :
    '#10B981';

  const bgColor =
    score >= 65 ? 'bg-red-100' :
    score >= 35 ? 'bg-amber-100' :
    'bg-emerald-100';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          {icon && <span className="text-sm">{icon}</span>}
          {label}
          {weight !== undefined && (
            <span className="text-slate-400 font-normal">({Math.round(weight * 100)}%)</span>
          )}
        </span>
        <span className="font-bold" style={{ color }}>{Math.round(score)}</span>
      </div>
      <div className={`h-2 rounded-full ${bgColor} overflow-hidden`}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={animate ? { width: 0 } : { width: `${score}%` }}
          animate={{ width: `${Math.min(100, score)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  );
}
