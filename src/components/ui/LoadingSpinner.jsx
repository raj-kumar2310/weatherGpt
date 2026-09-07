'use client';
import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md', label = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className={`${sizes[size] || sizes.md} rounded-full border-4 border-sky-100 border-t-sky-500`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      {label && <p className="text-sm text-slate-500 font-medium animate-pulse">{label}</p>}
    </div>
  );
}

/** Full-screen loading overlay for evaluating risk */
export function EvaluatingOverlay() {
  const steps = [
    'Fetching latest HRRR data…',
    'Applying terrain modifiers…',
    'Scoring 12 forecast blocks…',
    'Running Decision Engine v2.4…',
    'Generating optimal window…',
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <LoadingSpinner size="xl" />
      <div className="text-center space-y-2">
        <h3 className="text-white font-bold text-lg">Decision Engine Running</h3>
        <motion.p
          className="text-sky-300 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {steps[Math.floor(Date.now() / 1500) % steps.length]}
        </motion.p>
      </div>
      <div className="flex gap-2">
        {['Rain', 'Wind', 'UV', 'Humidity', 'Visibility'].map((label, i) => (
          <motion.div
            key={label}
            className="px-2 py-1 rounded bg-sky-900 text-sky-300 text-xs font-medium"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
          >
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
