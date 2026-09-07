'use client';
import { motion } from 'framer-motion';
import { User, MapPin, Sliders, Calendar, ShieldCheck, Trash2, Plus, Sparkles, Check } from 'lucide-react';
import useAppStore from '../../store/appStore';
import { Card } from '../ui/Card';

const USER_TYPES = [
  { id: 'farmer', icon: '🌾', label: 'Farmer Persona', desc: 'Weighted for irrigation, spraying & crop protection' },
  { id: 'fisherman', icon: '🎣', label: 'Fisherman Persona', desc: 'Weighted for sea state, wave swell & gale winds' },
  { id: 'traveller', icon: '🚗', label: 'Traveller Persona', desc: 'Weighted for ghat passes, fog visibility & landslides' },
  { id: 'event_organizer', icon: '🎪', label: 'Event Organizer', desc: 'Weighted for rain setup windows & venue cover' },
  { id: 'common_user', icon: '👤', label: 'Common User Persona', desc: 'Balanced baseline for everyday outdoor planning' },
];

export function ProfileScreen() {
  const userType = useAppStore((s) => s.userType);
  const setUserType = useAppStore((s) => s.setUserType);
  const personalPreferences = useAppStore((s) => s.personalPreferences);
  const setPersonalPreferences = useAppStore((s) => s.setPersonalPreferences);
  const savedPlaces = useAppStore((s) => s.savedPlaces);
  const savedPlans = useAppStore((s) => s.savedPlans);
  const setLocation = useAppStore((s) => s.setLocation);
  const resetPlanner = useAppStore((s) => s.resetPlanner);

  const activePersona = USER_TYPES.find((u) => u.id === userType) || USER_TYPES[4];

  return (
    <div className="pb-28 space-y-8 px-4 sm:px-6 lg:px-8 pt-4 max-w-5xl mx-auto">
      {/* 1. Header Profile Banner */}
      <motion.div
        className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
          {activePersona.icon}
        </div>
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-white/20 text-sky-100 backdrop-blur-md">
            Active Workspace Persona
          </span>
          <h2 className="font-extrabold text-2xl sm:text-3xl">{activePersona.label}</h2>
          <p className="text-sky-200 text-xs sm:text-sm">WeatherAction Intelligence Engine · Tamil Nadu Micro-zones</p>
        </div>
      </motion.div>

      {/* 2. Select Active Persona Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <span>👤</span> Select Persona Engine
          </h3>
          <p className="text-xs text-slate-500">Choosing a persona automatically tunes factor weights in the deterministic Risk Engine</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {USER_TYPES.map((type) => {
            const isSelected = userType === type.id;
            return (
              <button
                key={type.id}
                id={`profile-type-${type.id}`}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 card-hover-lift transition-all text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-50 to-indigo-50/50 border-sky-500 ring-4 ring-sky-400/30 shadow-md shadow-sky-500/15'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                }`}
                onClick={() => setUserType(type.id)}
              >
                <span className="text-3xl p-2 rounded-xl bg-white shadow-2xs border border-slate-100 flex-shrink-0">
                  {type.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-extrabold text-sm ${isSelected ? 'text-sky-700' : 'text-slate-900'}`}>
                      {type.label}
                    </span>
                    {isSelected && (
                      <span className="text-xs font-extrabold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={12} /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{type.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Personal Weather Tolerance Sliders */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Sliders size={18} className="text-sky-500" />
              <span>Personal Comfort Tolerances</span>
            </h3>
            <p className="text-xs text-slate-500">Fine-tune your Personal Comfort Score calculation baseline</p>
          </div>
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
            Comfort Engine v1.0
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Heat Tolerance */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Heat Tolerance</span>
              <span className="text-sky-600 font-extrabold uppercase">{personalPreferences?.heatTolerance || 'medium'}</span>
            </div>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  onClick={() => setPersonalPreferences({ heatTolerance: level })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                    (personalPreferences?.heatTolerance || 'medium') === level
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Rain Tolerance */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Rain Tolerance</span>
              <span className="text-sky-600 font-extrabold uppercase">{personalPreferences?.rainTolerance || 'medium'}</span>
            </div>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  onClick={() => setPersonalPreferences({ rainTolerance: level })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                    (personalPreferences?.rainTolerance || 'medium') === level
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Saved Places Manager */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <MapPin size={18} className="text-sky-500" />
              <span>Saved Operational Locations</span>
            </h3>
            <p className="text-xs text-slate-500">Quick-switch target weather zones for micro-location evaluation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {savedPlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => setLocation({ name: place.name, lat: place.lat, lon: place.lon, zone: place.label, terrain: 'plains' })}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-sky-50/50 hover:border-sky-300 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl group-hover:scale-110 transition-transform">{place.icon}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  GPS Set
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{place.label}</h4>
                <p className="text-xs text-slate-500">{place.name} ({place.lat}, {place.lon})</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Saved Weather Plans */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Calendar size={18} className="text-sky-500" />
              <span>Internal Weather Calendar & Saved Plans</span>
            </h3>
            <p className="text-xs text-slate-500">Saved activity schedules monitored by the Live Radar Engine</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {savedPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  🗓️
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{plan.name}</h4>
                  <p className="text-xs text-slate-500">{plan.locationName} · {plan.date} · {plan.timeWindow}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500 text-white self-start sm:self-auto">
                {plan.riskLevel} — Monitored
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Planner CTA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm">Reset Operational Planner</h4>
          <p className="text-xs text-slate-500">Clear all active activity parameters, route selections, and custom risk thresholds</p>
        </div>
        <button
          id="reset-planner-btn"
          onClick={resetPlanner}
          className="px-5 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-xs font-extrabold hover:bg-red-50 transition-colors whitespace-nowrap"
        >
          Reset All Parameters
        </button>
      </div>
    </div>
  );
}
