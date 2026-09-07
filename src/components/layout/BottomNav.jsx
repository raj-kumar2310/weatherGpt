'use client';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../../store/appStore';

const NAV_ITEMS = [
  { id: 'activities', label: 'Activities', icon: '⚡', screen: 'activity_selection' },
  { id: 'planner',    label: 'Planner',    icon: '📋', screen: 'input' },
  { id: 'monitor',   label: 'Monitor',    icon: '📡', screen: 'live_monitoring' },
  { id: 'profile',   label: 'Profile',    icon: '👤', screen: null },
];

export function BottomNav() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setScreen = useAppStore((s) => s.setScreen);
  const liveMonitoring = useAppStore((s) => s.liveMonitoring);

  const handleTab = (item) => {
    setActiveTab(item.id);
    if (item.screen) setScreen(item.screen);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl">
      <div className="max-w-[480px] mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const isMonitor = item.id === 'monitor';

          return (
            <button
              key={item.id}
              onClick={() => handleTab(item)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 relative transition-colors"
              id={`nav-${item.id}`}
            >
              {/* Active indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-sky-500"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                  />
                )}
              </AnimatePresence>

              <div className="relative">
                <span className={`text-xl transition-all ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                {/* Live dot for monitor */}
                {isMonitor && liveMonitoring && (
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
