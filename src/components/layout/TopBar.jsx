'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, MapPin, ChevronDown, Search, X, Check } from 'lucide-react';
import useAppStore from '../../store/appStore';
import { t } from '../../lib/translations';
import { searchCities, fetchForecast } from '../../lib/weatherApi';
import { TAMIL_NADU_CITIES } from '../../lib/activityConfig';

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
  { id: 'home',       labelKey: 'navHome',       icon: '🏠', screen: 'home' },
  { id: 'activities', labelKey: 'navActivities', icon: '⚡', screen: 'activity_selection' },
  { id: 'planner',    labelKey: 'navPlanner',    icon: '📋', screen: 'input' },
  { id: 'monitor',    labelKey: 'navMonitor',    icon: '📡', screen: 'live_monitoring' },
  { id: 'ai',         labelKey: 'navAI',         icon: '🤖', screen: 'ai_chat' },
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
  const setLocation = useAppStore((s) => s.setLocation);
  const setForecastBlocks = useAppStore((s) => s.setForecastBlocks);
  const setCurrentWeather = useAppStore((s) => s.setCurrentWeather);
  const language = useAppStore((s) => s.language) || 'en';

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef(null);

  const handleNavClick = (item) => {
    setActiveTab(item.id);
    if (item.screen) setScreen(item.screen);
  };

  const handleSearchChange = (queryVal) => {
    setSearchQuery(queryVal);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (queryVal.trim().length >= 1) {
      const localFiltered = TAMIL_NADU_CITIES.filter((c) =>
        c.name.toLowerCase().includes(queryVal.toLowerCase()) ||
        (c.zone && c.zone.toLowerCase().includes(queryVal.toLowerCase()))
      );

      if (localFiltered.length > 0) {
        setSearchResults(localFiltered);
      } else {
        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
          const results = await searchCities(queryVal.trim());
          setSearchResults(results.map((r) => ({
            name: r.name,
            zone: r.state ? `${r.state}, ${r.country || 'IN'}` : 'Location',
            terrain: 'plains',
            lat: r.lat,
            lon: r.lon,
          })));
          setIsSearching(false);
        }, 350);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectCity = async (city) => {
    try {
      setShowLocationModal(false);
      setSearchQuery('');
      setSearchResults([]);
      const isHill = ['ooty', 'valparai', 'kodaikanal', 'coonoor'].some((h) => city.name.toLowerCase().includes(h));
      const isCoast = ['rameswaram', 'chennai', 'cuddalore'].some((c) => city.name.toLowerCase().includes(c));

      const cityObj = {
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        zone: city.zone || `${city.name} Region`,
        terrain: isHill ? 'hills' : isCoast ? 'coastal' : 'plains',
      };
      setLocation(cityObj);

      const forecast = await fetchForecast(city.lat, city.lon);
      if (forecast?.blocks) setForecastBlocks(forecast.blocks);
      if (forecast?.current) setCurrentWeather(forecast.current);
    } catch {}
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {showBack && onBack ? (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors font-bold text-sm"
                id="top-bar-back"
              >
                ←
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/20">
                <span className="text-lg text-white">🌦️</span>
              </div>
            )}

            <div className="cursor-pointer" onClick={() => { setActiveTab('home'); setScreen('home'); }}>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">WeatherAction</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 tracking-wider">
                  v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 flex-shrink-0">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{t(item.labelKey, language)}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Info Pill & Interactive Location Selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Clickable Location Selector Button */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs text-slate-800 transition-all font-bold group shadow-2xs"
              title="Click to Change Location"
              id="topbar-location-btn"
            >
              <MapPin size={13} className="text-sky-600 group-hover:scale-110 transition-transform" />
              <span className="max-w-[100px] sm:max-w-[130px] truncate">{currentWeather?.name || location?.name || 'Coimbatore'}</span>
              <span className="font-extrabold text-sky-600">{currentWeather?.temp || 30}°C</span>
              <ChevronDown size={13} className="text-sky-500" />
            </button>

            {/* Cache/Live indicator */}
            {weatherFromCache ? (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-200 font-semibold">
                <WifiOff size={11} />
                <span>Cached ({weatherCacheAge}m)</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-xl border border-emerald-200 font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            )}

            {/* Language toggle (EN | தமிழ்) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => useAppStore.getState().setLanguage('en')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  useAppStore((s) => s.language) === 'en'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => useAppStore.getState().setLanguage('ta')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  useAppStore((s) => s.language) === 'ta'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* User persona button */}
            <button
              onClick={() => { setActiveTab('profile'); setScreen(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-sky-950 text-white shadow-sm hover:opacity-95 transition-opacity text-xs font-semibold"
              id="header-user-persona"
            >
              <span className="text-base">{USER_TYPE_ICONS[userType] || '👤'}</span>
              <span className="hidden sm:inline">{USER_TYPE_NAMES[userType] || 'Profile'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Location Selector Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
            <motion.div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Select Weather Location</h3>
                    <p className="text-xs text-slate-500">Pick a Tamil Nadu micro-zone or search any city</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search city (e.g., Ooty, Pollachi, Madurai, Chennai)..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
              </div>

              {/* City Results / Presets */}
              <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-hide pt-1">
                {isSearching && (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    Searching location databases…
                  </div>
                )}

                {(searchResults.length > 0 ? searchResults : TAMIL_NADU_CITIES).map((city) => {
                  const isCurrent = (location?.name || '').toLowerCase() === city.name.toLowerCase();
                  return (
                    <button
                      key={city.name}
                      onClick={() => handleSelectCity(city)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isCurrent
                          ? 'bg-sky-50 border border-sky-200 text-sky-700 font-extrabold'
                          : 'hover:bg-slate-50 border border-transparent text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={15} className={isCurrent ? 'text-sky-600' : 'text-slate-400'} />
                        <div>
                          <div className="text-sm font-bold">{city.name}</div>
                          <div className="text-[11px] text-slate-400">{city.zone || 'Tamil Nadu'} {city.terrain ? `· ${city.terrain}` : ''}</div>
                        </div>
                      </div>

                      {isCurrent && <Check size={16} className="text-sky-600" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
