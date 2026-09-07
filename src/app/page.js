'use client';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '../store/appStore';
import { UserTypeSelector } from '../components/onboarding/UserTypeSelector';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { ActivitySelection } from '../components/screens/ActivitySelection';
import { InputScreen } from '../components/screens/InputScreen';
import { DecisionResult } from '../components/screens/DecisionResult';
import { LiveMonitoring } from '../components/screens/LiveMonitoring';

const SCREEN_TITLES = {
  activity_selection: 'WeatherAction',
  input:              'Plan Details',
  decision_result:    'Decision Result',
  live_monitoring:    'Live Monitoring',
};

const PAGE_TRANSITION = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
  transition: { duration: 0.25, ease: 'easeInOut' },
};

function ProfileScreen() {
  const userType = useAppStore((s) => s.userType);
  const setUserType = useAppStore((s) => s.setUserType);
  const resetPlanner = useAppStore((s) => s.resetPlanner);

  const USER_TYPE_LABELS = {
    farmer: '🌾 Farmer Persona',
    fisherman: '🎣 Fisherman Persona',
    traveller: '🚗 Traveller Persona',
    event_organizer: '🎪 Event Organizer Persona',
    common_user: '👤 Common User Persona',
  };

  const userTypes = [
    { id: 'farmer', icon: '🌾', label: 'Farmer', desc: 'Weighted for irrigation, spraying & crop protection' },
    { id: 'fisherman', icon: '🎣', label: 'Fisherman', desc: 'Weighted for sea state, wave swell & gale winds' },
    { id: 'traveller', icon: '🚗', label: 'Traveller', desc: 'Weighted for ghat passes, fog visibility & landslides' },
    { id: 'event_organizer', icon: '🎪', label: 'Event Organizer', desc: 'Weighted for rain setup windows & venue cover' },
    { id: 'common_user', icon: '👤', label: 'Common User', desc: 'Balanced baseline for everyday outdoor planning' },
  ];

  return (
    <div className="pb-28 space-y-6 px-4 sm:px-6 lg:px-8 pt-4 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
          {USER_TYPE_LABELS[userType]?.split(' ')[0] || '👤'}
        </div>
        <div>
          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-white/20 text-sky-100 backdrop-blur-md">
            Active Workspace Persona
          </span>
          <h2 className="font-extrabold text-2xl sm:text-3xl mt-1">{USER_TYPE_LABELS[userType] || 'User'}</h2>
          <p className="text-sky-200 text-sm mt-1">WeatherAction Intelligence Engine · Tamil Nadu Micro-zones</p>
        </div>
      </div>

      {/* Switch Persona Cards Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Select Active Persona</h3>
          <p className="text-xs text-slate-500">Choosing a persona automatically tunes risk factor weights in the Decision Engine</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {userTypes.map((type) => (
            <button
              key={type.id}
              id={`profile-type-${type.id}`}
              className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                userType === type.id
                  ? 'bg-sky-50/80 border-sky-400 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
              }`}
              onClick={() => setUserType(type.id)}
            >
              <span className="text-3xl p-2 rounded-xl bg-white shadow-2xs border border-slate-100 flex-shrink-0">
                {type.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-extrabold text-sm ${userType === type.id ? 'text-sky-700' : 'text-slate-900'}`}>
                    {type.label}
                  </span>
                  {userType === type.id && <span className="text-sky-600 font-extrabold text-xs">✓ Active</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{type.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Reset Operational Planner</h4>
          <p className="text-xs text-slate-500">Clear all active activity parameters, route selections, and risk thresholds</p>
        </div>
        <button
          id="reset-planner-btn"
          onClick={resetPlanner}
          className="px-6 py-3 rounded-2xl border-2 border-red-200 text-red-600 text-xs font-extrabold hover:bg-red-50 transition-colors whitespace-nowrap"
        >
          Reset All Parameters
        </button>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-400 space-y-1 pt-4 pb-2">
        <p className="font-bold text-slate-600">WeatherAction Decision Platform v1.0</p>
        <p>Risk Engine v2.4 · Tamil Nadu Hyperlocal Micro-zones · OpenWeatherMap Radar API</p>
      </div>
    </div>
  );
}

export default function Home() {
  const screen = useAppStore((s) => s.screen);
  const onboardingDone = useAppStore((s) => s.onboardingDone);
  const activeTab = useAppStore((s) => s.activeTab);
  const setScreen = useAppStore((s) => s.setScreen);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  // Show onboarding if not done
  if (!onboardingDone || screen === 'onboarding') {
    return <UserTypeSelector />;
  }

  const showBack = ['input', 'decision_result'].includes(screen);

  const handleBack = () => {
    if (screen === 'decision_result') {
      setScreen('input');
      setActiveTab('planner');
    } else if (screen === 'input') {
      setScreen('activity_selection');
      setActiveTab('activities');
    }
  };

  const renderScreen = () => {
    // Profile tab override
    if (activeTab === 'profile') return <ProfileScreen />;

    switch (screen) {
      case 'activity_selection': return <ActivitySelection />;
      case 'input':              return <InputScreen />;
      case 'decision_result':    return <DecisionResult />;
      case 'live_monitoring':    return <LiveMonitoring />;
      default:                   return <ActivitySelection />;
    }
  };

  return (
    <div id="app-root">
      <TopBar
        title={activeTab === 'profile' ? 'Profile' : SCREEN_TITLES[screen] || 'WeatherAction'}
        showBack={showBack}
        onBack={handleBack}
      />

      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab === 'profile' ? 'profile' : screen}
            {...PAGE_TRANSITION}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
