'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Umbrella, Shirt, AlertCircle, CheckCircle2, Sparkles, MapPin, Plus, ShieldCheck } from 'lucide-react';
import useAppStore from '../../store/appStore';
import { evaluateTimeline, getRiskDisplay } from '../../lib/riskEngine';

const EVENT_TYPES = [
  { id: 'college', label: 'College / Exam Commute', icon: '🎓', defaultText: 'Daily college commute & classes' },
  { id: 'trip', label: 'Travel / Ghat Trip', icon: '🚗', defaultText: 'Mountain pass travel or weekend trip' },
  { id: 'outdoor_event', label: 'Outdoor Event / Festival', icon: '🎪', defaultText: 'Setup & gathering for outdoor venue' },
  { id: 'farm_spraying', label: 'Farm Field Operation', icon: '🌾', defaultText: 'Pesticide spraying & crop irrigation' },
  { id: 'daily_run', label: 'Outdoor Sports / Fitness', icon: '🏃', defaultText: 'Morning run or cycling session' },
];

export function CalendarEventPlanner() {
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const location = useAppStore((s) => s.location);
  const addSavedPlan = useAppStore((s) => s.addSavedPlan);

  const [selectedEventType, setSelectedEventType] = useState('college');
  const [eventTitle, setEventTitle] = useState('College Commute');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('16:30');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Evaluate weather for selected date
  const block = forecastBlocks[selectedDayIdx] || forecastBlocks[0] || {};
  const temp = Math.round(block.temp || 30);
  const humidity = block.humidity || 65;
  const rainProb = block.rainProbability ?? 20;
  const windSpeed = Math.round(block.windSpeed || 15);

  const riskLevel = rainProb > 55 || windSpeed > 35 ? 'HIGH_RISK' : rainProb > 30 ? 'MODERATE' : 'SAFE';
  const display = getRiskDisplay(riskLevel);

  // 1. Umbrella / Raincoat Alert Recommendation
  const needsUmbrella = rainProb >= 40;
  const umbrellaMessage = needsUmbrella
    ? `Rain chance is ${rainProb}%. Carry an umbrella or raincoat in your bag today! ☔`
    : `Low rain probability (${rainProb}%). No umbrella or heavy rain gear needed! ☀️`;

  // 2. Outfit / Dress Code Recommendation
  let outfitTitle = 'Light Cotton Clothing';
  let outfitMessage = 'Hot & humid conditions. Wear breathable, light-colored cotton clothes and stay hydrated.';
  if (rainProb > 50) {
    outfitTitle = 'Waterproof Jacket & Rubber Footwear';
    outfitMessage = 'Rain showers expected during commute. Wear water-resistant outerwear and non-slip footwear.';
  } else if (temp < 22) {
    outfitTitle = 'Light Sweater or Windbreaker';
    outfitMessage = 'Cooler temperatures in hill micro-zones. Carry a light jacket or sweater.';
  }

  const handleSaveEvent = () => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDayIdx);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    addSavedPlan({
      id: `plan-${Date.now()}`,
      name: eventTitle || 'Scheduled Event',
      activityId: selectedEventType,
      locationName: location?.name || 'Coimbatore',
      date: dateStr,
      timeWindow: `${startTime} – ${endTime}`,
      riskLevel: display.label,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[11px] font-extrabold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100 uppercase tracking-wider">
            Smart Calendar Event Intelligence
          </span>
          <h3 className="font-extrabold text-slate-900 text-lg mt-1 flex items-center gap-2">
            <span>📅</span> Event Weather & Gear Planner
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <MapPin size={14} className="text-sky-500" />
          <span>{location?.name || 'Coimbatore'} Zone</span>
        </div>
      </div>

      {/* 1. Event Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider block">
          Select Event Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {EVENT_TYPES.map((evt) => {
            const isSelected = selectedEventType === evt.id;
            return (
              <button
                key={evt.id}
                onClick={() => {
                  setSelectedEventType(evt.id);
                  setEventTitle(evt.label.split(' / ')[0]);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-50 border-sky-400 text-sky-700 ring-2 ring-sky-400/30 shadow-xs font-extrabold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-2xl">{evt.icon}</span>
                <span className="text-xs leading-tight">{evt.label.split(' / ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Date Picker Grid (14-Day Forecast Window) */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider block">
          Event Date & Weather Outlook
        </label>
        <div className="grid grid-cols-7 gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() + idx);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dateNum = d.getDate();

            const isSelected = selectedDayIdx === idx;
            const b = forecastBlocks[idx] || {};
            const rain = b.rainProbability ?? (idx % 2 === 0 ? 15 : 65);
            const riskDot = rain > 55 ? '🔴' : rain > 30 ? '🟡' : '🟢';

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-white border-sky-500 shadow-md scale-105 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`text-[10px] uppercase font-bold ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  {dayName}
                </div>
                <div className="text-sm font-black">{dateNum}</div>
                <div className="text-[10px] mt-0.5">{riskDot}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Event Details & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Event Title</label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
          />
        </div>
      </div>

      {/* 4. Practical Weather & Gear Recommendations (Umbrella + Outfit Tips) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Umbrella / Raincoat Alert */}
        <div
          className="p-5 rounded-2xl border flex items-start gap-4 transition-all"
          style={{
            backgroundColor: needsUmbrella ? '#FFFBEB' : '#F0FDF4',
            borderColor: needsUmbrella ? '#FDE68A' : '#BBF7D0',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-xs"
            style={{
              backgroundColor: needsUmbrella ? '#FEF3C7' : '#DCFCE7',
              color: needsUmbrella ? '#D97706' : '#15803D',
            }}
          >
            <Umbrella size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: needsUmbrella ? '#B45309' : '#166534' }}>
                {needsUmbrella ? '☔ Rain Gear Alert' : '☀️ No Umbrella Needed'}
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white shadow-2xs">
                Rain: {rainProb}%
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">{umbrellaMessage}</p>
          </div>
        </div>

        {/* Outfit / Clothing Recommendation */}
        <div className="p-5 rounded-2xl border bg-sky-50/70 border-sky-200/80 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
            <Shirt size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                👕 Dress Code & Outfit Advice
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white text-sky-700 shadow-2xs">
                {temp}°C · {humidity}% Hum
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">{outfitTitle}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{outfitMessage}</p>
          </div>
        </div>
      </div>

      {/* Save Event CTA */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400 font-medium">
          Saved plans are automatically monitored for weather shifts
        </span>

        <button
          onClick={handleSaveEvent}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all"
        >
          {savedSuccess ? <CheckCircle2 size={16} /> : <Plus size={16} />}
          <span>{savedSuccess ? 'Event Saved to Monitor!' : 'Save Event Schedule'}</span>
        </button>
      </div>
    </div>
  );
}
