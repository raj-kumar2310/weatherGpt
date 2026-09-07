'use client';
import { WifiOff, CloudSun, MapPin, ChevronRight, User } from 'lucide-react';
import useAppStore from '../../store/appStore';

const USER_TYPE_ICONS = {
  farmer: '🌾',
  fisherman: '🎣',
  traveller: '🚗',
  event_organizer: '🎪',
  common_user: '👤',
};

const USER_TYPE_NAMES = {
  farmer: 'Farmer',
  fisherman: 'Fisherman',
  traveller: 'Traveller',
  event_organizer: 'Event Org',
  common_user: 'Common User',
};

const NAV_ITEMS = [
  { id: 'activities', label: 'Activities', icon: '⚡', screen: 'activity_selection' },
  { id: 'planner',    label: 'Planner Matrix', icon: '📋', screen: 'input' },
  { id: 'monitor',   label: 'Live Monitor',   icon: '📡', screen: 'live_monitoring' },
  { id: 'profile',   label: 'Persona & Settings', icon: '👤', screen: null },
];

export function TopBar({ title = 'WeatherAction', showBack = false, onBack }) {
  const userType = useAppStore((s) => s.userType);
  const weatherFromCache = useAppStore((s) => s.weatherFromCache);
  const weatherCacheAge = useAppStore((s) => s.weatherCacheAge);
  const currentWeather = useAppStore((s) => s.currentWeather);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setScreen = useAppStore((s) => s.setScreen);
  const location = useAppStore((s) => s.location);

  const handleNavClick = (item) => {
    setActiveTab(item.id);
    if (item.screen) setScreen(item.screen);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors font-bold"
              id="top-bar-back"
            >
              ←
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <span className="text-xl text-white">🌦️</span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-lg tracking-tight">WeatherAction</span>
              <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 tracking-wider">
                v2.4 Web
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Decision Intelligence Platform · Tamil Nadu Micro-zones</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Info Pill & User Badge */}
        <div className="flex items-center gap-3">
          {currentWeather && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <MapPin size={13} className="text-sky-500" />
              <span className="font-bold text-slate-800">{currentWeather.name || location.name}</span>
              <span className="text-slate-300">·</span>
              <span className="font-extrabold text-sky-600">{currentWeather.temp}°C</span>
              <span className="text-slate-400 capitalize">({currentWeather.weatherDesc})</span>
            </div>
          )}

          {/* Cache/Live badge */}
          {weatherFromCache ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
              <WifiOff size={12} />
              <span className="hidden sm:inline font-semibold">Cached ({weatherCacheAge}m)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">LIVE RADAR</span>
            </div>
          )}

          {/* User persona button */}
          <button
            onClick={() => { setActiveTab('profile'); setScreen(null); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-sky-950 text-white shadow-sm hover:opacity-95 transition-opacity text-xs font-semibold"
            id="header-user-persona"
          >
            <span className="text-base">{USER_TYPE_ICONS[userType] || '👤'}</span>
            <span className="hidden sm:inline">{USER_TYPE_NAMES[userType] || 'Profile'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

