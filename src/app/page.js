'use client';
import { AnimatePresence, motion } from 'framer-motion';
import useAppStore from '../store/appStore';
import { UserTypeSelector } from '../components/onboarding/UserTypeSelector';
import { TopBar } from '../components/layout/TopBar';
import { BottomNav } from '../components/layout/BottomNav';
import { HomeScreen } from '../components/screens/HomeScreen';
import { ActivitySelection } from '../components/screens/ActivitySelection';
import { InputScreen } from '../components/screens/InputScreen';
import { DecisionResult } from '../components/screens/DecisionResult';
import { LiveMonitoring } from '../components/screens/LiveMonitoring';
import { ProfileScreen } from '../components/screens/ProfileScreen';
import { AICopilotChat } from '../components/ai/AICopilotChat';

const SCREEN_TITLES = {
  home:               'WeatherAction Home',
  activity_selection: 'Activities',
  input:              'Planner Details',
  decision_result:    'Decision Result',
  live_monitoring:    'Live Monitor',
  ai_chat:            'AI Assistant',
};

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: 'easeInOut' },
};

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
      setScreen('home');
      setActiveTab('home');
    }
  };

  const renderScreen = () => {
    if (activeTab === 'home') return <HomeScreen />;
    if (activeTab === 'profile') return <ProfileScreen />;
    if (activeTab === 'ai' || screen === 'ai_chat') {
      return (
        <div className="pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <AICopilotChat />
        </div>
      );
    }
    if (activeTab === 'monitor' || screen === 'live_monitoring') return <LiveMonitoring />;
    if (activeTab === 'activities' && screen !== 'decision_result' && screen !== 'input') {
      return <ActivitySelection />;
    }

    switch (screen) {
      case 'home':               return <HomeScreen />;
      case 'activity_selection': return <ActivitySelection />;
      case 'input':              return <InputScreen />;
      case 'decision_result':    return <DecisionResult />;
      case 'live_monitoring':    return <LiveMonitoring />;
      default:                   return <HomeScreen />;
    }
  };

  return (
    <div id="app-root">
      <TopBar
        title={SCREEN_TITLES[screen] || 'WeatherAction'}
        showBack={showBack}
        onBack={handleBack}
      />

      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + '-' + screen}
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
