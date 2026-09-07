'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export function SevereWarningBanner({ warnings = [] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-3 mb-4">
        {warnings.map((warn, idx) => (
          <motion.div
            key={warn.type || idx}
            className={`rounded-2xl p-4 sm:p-5 border flex items-start gap-4 shadow-md ${
              warn.severity === 'CRITICAL'
                ? 'bg-red-600 text-white border-red-700 shadow-red-600/20'
                : 'bg-amber-500 text-slate-950 border-amber-600 shadow-amber-500/20'
            }`}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl flex-shrink-0">
              {warn.icon || '⚠️'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/30 tracking-wider">
                  {warn.severity} HAZARD ALERT
                </span>
                <span className="text-xs opacity-80 font-bold">India Meteorological Dept / OWM Alert</span>
              </div>

              <h4 className="font-black text-base sm:text-lg leading-tight mt-1">
                {warn.title}
              </h4>
              <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-95 font-medium">
                {warn.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
