'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import useAppStore from '../../store/appStore';

const USER_TYPES = [
  {
    id: 'farmer',
    icon: '🌾',
    label: 'Farmer',
    desc: 'Irrigation, spraying & crop planning',
    gradient: 'from-emerald-400 to-green-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
  {
    id: 'fisherman',
    icon: '🎣',
    label: 'Fisherman',
    desc: 'Sea conditions, wave height & wind',
    gradient: 'from-blue-400 to-cyan-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  {
    id: 'traveller',
    icon: '🚗',
    label: 'Traveller',
    desc: 'Road conditions & ghat passes',
    gradient: 'from-violet-400 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-300',
  },
  {
    id: 'event_organizer',
    icon: '🎪',
    label: 'Event Organizer',
    desc: 'Setup windows & rain risk',
    gradient: 'from-pink-400 to-rose-600',
    bg: 'bg-pink-50',
    border: 'border-pink-300',
  },
  {
    id: 'common_user',
    icon: '👤',
    label: 'Common User',
    desc: 'General outdoor safety guidance',
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
  },
];

export function UserTypeSelector() {
  const setUserType = useAppStore((s) => s.setUserType);
  const setScreen = useAppStore((s) => s.setScreen);
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 600));
    setUserType(selected);
    setScreen('activity_selection');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 overflow-y-auto flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col max-w-5xl mx-auto w-full px-5 py-10 justify-between">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mb-4 shadow-xl shadow-sky-500/30">
            <span className="text-4xl">🌦️</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">WeatherAction</h1>
          <p className="text-sky-300 text-base font-semibold">Hyperlocal Weather Decision Intelligence Platform</p>
          <div className="mt-4 h-1 w-24 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 mx-auto rounded-full" />
          <p className="mt-4 text-slate-300 text-sm max-w-md mx-auto">
            Choose your persona to unlock custom risk weighting for agriculture, sea fishing, ghat roads, or outdoor events.
          </p>
        </motion.div>

        {/* User type cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-auto py-4">
          {USER_TYPES.map((type, i) => {
            const isSelected = selected === type.id;
            return (
              <motion.button
                key={type.id}
                id={`user-type-${type.id}`}
                className={`flex flex-col items-center text-center p-6 rounded-3xl border-2 transition-all relative overflow-hidden
                  ${isSelected
                    ? `${type.bg} ${type.border} shadow-2xl scale-[1.03]`
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                onClick={() => setSelected(type.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileTap={{ scale: 0.97 }}
              >
                {isSelected && (
                  <motion.div
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center shadow-md"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <span className="text-white text-xs font-black">✓</span>
                  </motion.div>
                )}

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-3xl shadow-lg mb-4 flex-shrink-0`}>
                  {type.icon}
                </div>
                <div className="space-y-1">
                  <div className={`font-extrabold text-base ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                    {type.label}
                  </div>
                  <div className={`text-xs leading-relaxed ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                    {type.desc}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="pt-6 max-w-md mx-auto w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            id="onboarding-continue"
            onClick={handleContinue}
            disabled={!selected || confirming}
            className={`w-full py-4 sm:py-5 rounded-2xl font-extrabold text-lg transition-all shadow-xl
              ${selected
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sky-500/40 hover:opacity-95'
                : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
            whileTap={selected ? { scale: 0.97 } : {}}
          >
            {confirming ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                />
                Setting up persona engine…
              </span>
            ) : (
              'Enter WeatherAction Workspace →'
            )}
          </motion.button>
          <p className="text-center text-slate-400 text-xs mt-3">
            Switch persona anytime from the top navigation bar
          </p>
        </motion.div>
      </div>
    </div>
  );
}
