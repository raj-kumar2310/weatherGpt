'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Radio, Clock, ArrowLeft, Volume2, VolumeX, ShieldCheck, MapPin } from 'lucide-react';
import useAppStore from '../../store/appStore';
import { ACTIVITIES, PERSONA_RECOMMENDATIONS } from '../../lib/activityConfig';
import { getRiskDisplay, scoreBlock } from '../../lib/riskEngine';
import { getRouteWaypointsWeather, getClimateComparison } from '../../lib/weatherApi';
import { t } from '../../lib/translations';
import { Card } from '../ui/Card';
import { RiskBar } from '../ui/RiskBar';
import { Timeline } from '../ui/TimelineBlock';
import { StepIndicator } from '../ui/StepIndicator';
import { SevereWarningBanner } from '../ui/SevereWarningBanner';
import { RouteMap } from '../ui/RouteMap';

const FACTOR_META = {
  rain:       { label: 'rainRiskLabel',       icon: '🌧️' },
  wind:       { label: 'windRiskLabel',       icon: '💨' },
  visibility: { label: 'visibilityLabel',     icon: '👁️' },
  humidity:   { label: 'humidityLabel',       icon: '💧' },
  uvIndex:    { label: 'uvIndexLabel',        icon: '☀️' },
};

function formatOptimalWindow(window) {
  if (!window) return null;
  const fmt = (d) => d instanceof Date
    ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '--';
  return `${fmt(window.start)} – ${fmt(window.end)}`;
}

function WeatherChips({ blocks, lang }) {
  if (!blocks?.length) return null;
  const first = blocks[0];
  const chips = [
    { icon: '🌧️', label: 'Rain',       value: `${first.rainProbability ?? 0}%` },
    { icon: '💨', label: 'Wind',       value: `${Math.round(first.windSpeed ?? 0)} km/h` },
    { icon: '👁️', label: 'Visibility', value: `${((first.visibility ?? 10000) / 1000).toFixed(1)} km` },
    { icon: '💧', label: 'Humidity',   value: `${first.humidity ?? 0}%` },
    { icon: '☀️', label: 'UV Index',   value: `${first.uvIndex ?? 0}` },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {chips.map((chip, i) => (
        <motion.div
          key={chip.label}
          className="flex-shrink-0 flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 min-w-[68px] shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <span className="text-lg">{chip.icon}</span>
          <span className="text-xs font-bold text-slate-800">{chip.value}</span>
          <span className="text-xs text-slate-400">{chip.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function RecommendationCard({ riskResult, userType, activityId, lang }) {
  const userKey = userType || 'common_user';
  const riskLevel = riskResult?.overall?.riskLevel || 'SAFE';
  const template = PERSONA_RECOMMENDATIONS[userKey]?.[riskLevel] || PERSONA_RECOMMENDATIONS.common_user[riskLevel];
  const display = getRiskDisplay(riskLevel);

  return (
    <motion.div
      className="rounded-2xl p-5 space-y-3"
      style={{ backgroundColor: `${display.color}12`, border: `1.5px solid ${display.color}30` }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: display.color }}>
            {t('actionAdviceTitle', lang)}
          </p>
          <h3 className="font-bold text-slate-900 text-base leading-snug">
            {template.title}
          </h3>
        </div>
        <div
          className="text-2xl font-black px-3 py-1.5 rounded-xl"
          style={{ color: display.color, backgroundColor: `${display.color}20` }}
        >
          {t(display.label === 'GO' ? 'goVerdict' : display.label === 'CAUTION' ? 'cautionVerdict' : 'avoidVerdict', lang).split(' — ')[0] || display.label}
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{template.body}</p>
      <div className="pt-2 border-t" style={{ borderColor: `${display.color}30` }}>
        <p className="text-xs font-semibold" style={{ color: display.color }}>
          📌 {template.action}
        </p>
      </div>
    </motion.div>
  );
}

function useCountUp(targetValue, duration = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const numericTarget = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue);
    if (isNaN(numericTarget)) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * numericTarget * 10) / 10);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, duration]);

  return count;
}

export function DecisionResult() {
  const riskResult = useAppStore((s) => s.riskResult);
  const selectedActivity = useAppStore((s) => s.selectedActivity);
  const userType = useAppStore((s) => s.userType);
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const origin = useAppStore((s) => s.origin);
  const destination = useAppStore((s) => s.destination);
  const routeMode = useAppStore((s) => s.routeMode);
  const location = useAppStore((s) => s.location);
  const language = useAppStore((s) => s.language) || 'en';

  const setScreen = useAppStore((s) => s.setScreen);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setLiveMonitoring = useAppStore((s) => s.setLiveMonitoring);

  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [speaking, setSpeaking] = useState(false);

  const animatedScore = useCountUp(riskResult?.overall?.totalScore ?? 0);

  const activity = ACTIVITIES[selectedActivity];
  const riskLevel = riskResult?.overall?.riskLevel || 'SAFE';
  const display = getRiskDisplay(riskLevel);
  const optimalWindow = riskResult?.optimalWindow;
  const factors = riskResult?.overall?.factors || {};
  const weights = riskResult?.overall?.weights || {};
  const blocks = riskResult?.blocks?.length ? riskResult.blocks : forecastBlocks.slice(0, 12).map((b) => ({
    ...b,
    riskLevel: 'SAFE',
    time: new Date((b.dt || 0) * 1000),
  }));

  // Fetch waypoints weather when in route mode
  useEffect(() => {
    if (origin && destination && routeMode === 'route') {
      getRouteWaypointsWeather(origin, destination).then((wps) => {
        const scoredWps = wps.map((wp) => {
          const blocks = wp.forecastBlocks || [];
          const terrain = wp.terrain || 'plains';
          const firstBlock = blocks[0] || { rainProbability: 10, windSpeed: 10 };
          const scored = scoreBlock(firstBlock, selectedActivity || 'bike_ride', terrain);
          return { ...wp, scored };
        });
        setRouteWaypoints(scoredWps);
      });
    }
  }, [origin, destination, routeMode, selectedActivity]);

  const climateComp = getClimateComparison(
    origin?.name || location?.name || 'Coimbatore',
    forecastBlocks[0]?.temp || 28,
    forecastBlocks[0]?.rainProbability || 10
  );

  const speakDecision = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = language === 'ta'
      ? `${activity?.name || 'செயல்பாடு'} பாதுகாப்பு முடிவு: ${display.label}. ஆபத்து குறியீடு ${riskResult?.overall?.totalScore || 0}.`
      : `Safety Verdict: ${display.label} for ${activity?.name || 'Activity'}. Composite Risk Score: ${riskResult?.overall?.totalScore || 0} out of 100.`;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const handleEnableMonitoring = () => {
    setLiveMonitoring(true);
    setActiveTab('monitor');
    setScreen('live_monitoring');
  };

  const handleBack = () => {
    setScreen('input');
    setActiveTab('planner');
  };

  if (!riskResult && !forecastBlocks.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <p className="text-3xl mb-3">📊</p>
          <p className="font-medium">No evaluation yet</p>
          <button className="mt-3 text-sky-500 text-sm font-medium" onClick={handleBack}>
            ← Go back to planner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 space-y-6 px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto">
      {/* Step Indicator & Edit Plan button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
        <StepIndicator current={3} total={3} labels={[t('stepSelectActivity', language), t('stepPlanDetails', language), t('stepDecisionMatrix', language)]} />
        <button onClick={handleBack} className="flex items-center gap-1.5 text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 hover:bg-sky-100 transition-colors self-start sm:self-auto">
          <ArrowLeft size={13} /> Edit Operational Parameters
        </button>
      </div>

      {/* Severe Weather Warning-First Banner (Phase 7) */}
      <SevereWarningBanner warnings={riskResult?.overall?.warnings} />

      {/* Desktop 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Hero Badge, Timeline & Waypoints */}
        <div className="lg:col-span-6 space-y-6">
          {/* Interactive Vector Route Map (Phase 5 & 12) */}
          {routeMode === 'route' && routeWaypoints.length > 0 && (
            <RouteMap waypoints={routeWaypoints} origin={origin} destination={destination} />
          )}

          {/* Hero risk indicator */}
          <motion.div
            className="rounded-3xl p-8 text-center space-y-4 shadow-lg relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${display.color}18, ${display.color}08)`, border: `2px solid ${display.color}45` }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center justify-between">
              {activity && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 text-slate-700 text-xs font-bold shadow-2xs">
                  <span className="text-base">{activity.icon}</span>
                  <span>{activity.name} {t('decisionVerdictTitle', language)}</span>
                </div>
              )}

              <button
                onClick={speakDecision}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  speaking ? 'bg-amber-500 text-white animate-pulse' : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-600'
                }`}
              >
                {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{speaking ? t('stopVoiceBtn', language) : t('speakAdviceBtn', language)}</span>
              </button>
            </div>

            {/* Big GO / CAUTION / AVOID */}
            <motion.div
              className="text-6xl sm:text-7xl font-black tracking-widest my-2"
              style={{ color: display.color }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {display.label}
            </motion.div>

            <div className="text-slate-600 text-sm font-medium">
              {t('riskScoreLabel', language)}: <span className="font-extrabold text-slate-900 text-base">{animatedScore} / 100</span>
            </div>

            {/* Optimal window pill */}
            {optimalWindow && (
              <motion.div
                className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-full shadow-md shadow-emerald-500/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Clock size={15} />
                <span className="text-xs sm:text-sm font-extrabold">Optimal Start Window: {formatOptimalWindow(optimalWindow)}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Route Waypoints Risk Card (Phase 4) */}
          {routeWaypoints.length > 0 && (
            <Card className="p-5 space-y-3 bg-white border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} className="text-sky-500" />
                  {t('routeRiskTitle', language)}
                </h4>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Multi-zone Fetch</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {routeWaypoints.map((wp, idx) => {
                  const wpDisplay = getRiskDisplay(wp.scored?.riskLevel || 'SAFE');
                  return (
                    <div
                      key={wp.name || idx}
                      className="p-3 rounded-xl border flex flex-col justify-between space-y-1"
                      style={{ backgroundColor: wpDisplay.bgColor, borderColor: wpDisplay.borderColor }}
                    >
                      <div className="text-xs font-extrabold text-slate-800 truncate">{wp.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{wp.terrain}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-black" style={{ color: wpDisplay.color }}>
                          {wpDisplay.label}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">{wp.scored?.totalScore}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hourly Risk Timeline</h3>
                <p className="text-xs text-slate-400">12-hour predictive safety window</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />GO</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />CAUTION</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />AVOID</span>
              </div>
            </div>
            <Timeline blocks={blocks} />
          </Card>

          {/* Weather chips row */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Atmospheric Conditions</h4>
            <WeatherChips blocks={forecastBlocks} lang={language} />
          </div>
        </div>

        {/* Right Column: Persona Advisory, Factor Breakdown & Actions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Persona-aware recommendation */}
          <RecommendationCard riskResult={riskResult} userType={userType} activityId={selectedActivity} lang={language} />

          {/* Historical Climate Comparison Card (Phase 6) */}
          <Card className="p-5 space-y-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">{t('climateComparisonTitle', language)}</h4>
                  <p className="text-[11px] text-slate-400">{climateComp.month} Baseline Analysis</p>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                climateComp.status === 'ABOVE_AVERAGE' ? 'bg-amber-900/60 text-amber-300 border-amber-700' : 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
              }`}>
                {climateComp.status === 'ABOVE_AVERAGE' ? t('climateStatusAbove', language) : t('climateStatusNear', language)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-semibold">{t('expectedRainLabel', language)}</div>
                <div className="text-lg font-black text-sky-400">{climateComp.currentExpectedRainMm} mm</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-semibold">{t('historicalAverageLabel', language)}</div>
                <div className="text-lg font-black text-slate-200">{climateComp.historicalDailyRainMm} mm/day</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Source: {climateComp.dataSource}</span>
              <span>Updated: {climateComp.lastUpdated}</span>
            </div>
          </Card>

          {/* Risk factor breakdown */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('vectorBreakdownTitle', language)}</h3>
                <p className="text-xs text-slate-400">5-vector algorithmic scoring</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-700 font-bold uppercase">Active Radar</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {Object.entries(FACTOR_META).map(([key, meta]) => (
                <RiskBar
                  key={key}
                  label={t(meta.label, language)}
                  icon={meta.icon}
                  score={factors[key] ?? 0}
                  weight={weights[key]}
                />
              ))}
            </div>
          </Card>

          {/* Action CTA row */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <motion.button
              id="enable-monitoring-btn"
              onClick={handleEnableMonitoring}
              className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-teal-500 via-sky-600 to-indigo-600 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-teal-500/20 hover:opacity-95 transition-all"
              whileTap={{ scale: 0.97 }}
            >
              <Radio size={18} />
              <span>Enable Live Monitoring</span>
            </motion.button>

            <motion.button
              id="share-plan-btn"
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-xs hover:border-sky-300 hover:text-sky-600 transition-all text-sm"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const text = `Weather Decision: ${display.label} for ${activity?.name} | Risk Score: ${riskResult?.overall?.totalScore}/100 | WeatherAction`;
                if (navigator.share) navigator.share({ title: 'WeatherAction Plan', text });
                else navigator.clipboard?.writeText(text);
              }}
            >
              <Share2 size={18} />
              <span>Share Decision</span>
            </motion.button>
          </div>

          {/* Weather Data Source Attribution Badge (Phase 7) */}
          <div className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Weather Data & Decision Engine: OpenWeatherMap · Google Gemini REST API</span>
          </div>
        </div>
      </div>
    </div>
  );
}

