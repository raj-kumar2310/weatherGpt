'use client';
import { motion } from 'framer-motion';

export function Badge({ children, variant = 'default', size = 'md', pulse = false, className = '' }) {
  const variants = {
    go:       'bg-emerald-100 text-emerald-800 border border-emerald-200',
    caution:  'bg-amber-100 text-amber-800 border border-amber-200',
    avoid:    'bg-red-100 text-red-800 border border-red-200',
    primary:  'bg-sky-100 text-sky-800 border border-sky-200',
    default:  'bg-slate-100 text-slate-700 border border-slate-200',
    dark:     'bg-slate-800 text-slate-100 border border-slate-700',
    teal:     'bg-teal-500 text-white border border-teal-600',
    live:     'bg-emerald-500 text-white border border-emerald-600',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold',
    lg: 'px-3 py-1.5 text-sm font-bold',
    xl: 'px-4 py-2 text-base font-black tracking-widest',
  };

  return (
    <motion.span
      className={`inline-flex items-center gap-1 rounded-full uppercase ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      animate={pulse ? { opacity: [1, 0.5, 1] } : {}}
      transition={pulse ? { duration: 1.5, repeat: Infinity } : {}}
    >
      {children}
    </motion.span>
  );
}

export function RiskBadge({ riskLevel, size = 'md' }) {
  const map = {
    SAFE:      { variant: 'go',      label: 'GO' },
    MODERATE:  { variant: 'caution', label: 'CAUTION' },
    HIGH_RISK: { variant: 'avoid',   label: 'AVOID' },
  };
  const { variant, label } = map[riskLevel] || map.SAFE;
  return <Badge variant={variant} size={size}>{label}</Badge>;
}
