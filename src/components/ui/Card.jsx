'use client';
import { motion } from 'framer-motion';

export function Card({ children, className = '', hover = false, onClick, glass = false }) {
  const base = `rounded-2xl border ${glass
    ? 'bg-white/70 backdrop-blur-md border-white/40 shadow-lg'
    : 'bg-white border-slate-200 shadow-sm'}`;

  if (onClick || hover) {
    return (
      <motion.div
        className={`${base} cursor-pointer ${className}`}
        onClick={onClick}
        whileHover={{ scale: 1.015, boxShadow: '0 8px 32px rgba(14,165,233,0.12)' }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${base} ${className}`}>
      {children}
    </div>
  );
}
