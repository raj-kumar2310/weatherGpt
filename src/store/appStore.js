/**
 * Zustand Global Store
 * Central state for user type, selected activity, location, weather data,
 * risk results, and the live monitoring simulation.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set, get) => ({
      // ─── Language ─────────────────────────────────────────────────
      language: 'en',  // 'en' | 'ta'
      setLanguage: (lang) => set({ language: lang }),

      // ─── Onboarding ───────────────────────────────────────────────
      userType: null,         // 'farmer' | 'fisherman' | 'traveller' | 'event_organizer' | 'common_user'
      onboardingDone: false,

      setUserType: (userType) => set({ userType, onboardingDone: true }),

      // ─── Navigation ───────────────────────────────────────────────
      // 'onboarding' | 'home' | 'activity_selection' | 'input' | 'decision_result' | 'live_monitoring' | 'ai_chat'
      screen: 'onboarding',
      activeTab: 'home',  // 'home' | 'activities' | 'planner' | 'monitor' | 'ai' | 'profile'

      setScreen: (screen) => set({ screen }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ─── Personal Preferences ────────────────────────────────────
      personalPreferences: {
        heatTolerance: 'medium',
        humidityTolerance: 'medium',
        windTolerance: 'medium',
        rainTolerance: 'medium',
      },
      setPersonalPreferences: (prefs) => set((s) => ({
        personalPreferences: { ...s.personalPreferences, ...prefs },
      })),

      // ─── Saved Places & Plans ────────────────────────────────────
      savedPlaces: [
        { id: 'place-home', label: 'Home Base', name: 'Coimbatore', lat: 11.0168, lon: 76.9558, icon: '🏠' },
        { id: 'place-farm', label: 'Agrarian Field', name: 'Pollachi', lat: 10.6609, lon: 77.0048, icon: '🌾' },
        { id: 'place-hill', label: 'Ghat Retreat', name: 'Valparai', lat: 10.3204, lon: 76.9511, icon: '⛰️' },
      ],
      savedPlans: [
        {
          id: 'plan-1',
          name: 'Morning Field Spraying',
          activityId: 'farming',
          locationName: 'Pollachi',
          date: 'Tomorrow',
          timeWindow: '07:00 AM – 10:00 AM',
          riskLevel: 'SAFE',
        },
      ],
      addSavedPlan: (plan) => set((s) => ({ savedPlans: [plan, ...s.savedPlans] })),

      // ─── Activity Selection ───────────────────────────────────────
      selectedActivity: null,   // id from ACTIVITIES config

      setSelectedActivity: (id) => set({ selectedActivity: id }),

      // ─── Location / Weather ───────────────────────────────────────
      location: {
        name: 'Coimbatore',
        lat: 11.0168,
        lon: 76.9558,
        zone: 'Coimbatore Basin',
        terrain: 'plains',
      },
      currentWeather: null,
      forecastBlocks: [],
      weatherLoading: false,
      weatherError: null,
      weatherFromCache: false,
      weatherCacheAge: 0,

      setLocation: (loc) => set({ location: loc }),
      setCurrentWeather: (w) => set({ currentWeather: w }),
      setForecastBlocks: (blocks) => set({ forecastBlocks: blocks }),
      setWeatherLoading: (v) => set({ weatherLoading: v }),
      setWeatherError: (e) => set({ weatherError: e }),
      setWeatherCache: (fromCache, age) =>
        set({ weatherFromCache: fromCache, weatherCacheAge: age }),

      // ─── Input Screen state ───────────────────────────────────────
      routeMode: 'point',        // 'point' | 'route'
      origin: null,
      destination: null,
      selectedDate: 'today',     // 'today' | 'tomorrow' | 'day_after'
      startTime: '07:00',
      endTime: '11:00',
      rainLimit: 40,             // %
      windGustMax: 30,           // km/h

      setRouteMode: (m) => set({ routeMode: m }),
      setOrigin: (o) => set({ origin: o }),
      setDestination: (d) => set({ destination: d }),
      setSelectedDate: (d) => set({ selectedDate: d }),
      setStartTime: (t) => set({ startTime: t }),
      setEndTime: (t) => set({ endTime: t }),
      setRainLimit: (v) => set({ rainLimit: v }),
      setWindGustMax: (v) => set({ windGustMax: v }),

      // ─── Decision Result ──────────────────────────────────────────
      riskResult: null,    // { overall: {}, blocks: [], optimalWindow: {} }
      isEvaluating: false,

      setRiskResult: (r) => set({ riskResult: r }),
      setIsEvaluating: (v) => set({ isEvaluating: v }),

      // ─── Live Monitoring ──────────────────────────────────────────
      liveMonitoring: false,
      simulationActive: false,
      simulatedAlert: null,   // { message, severity } | null

      setLiveMonitoring: (v) => set({ liveMonitoring: v }),

      triggerSimulation: () => {
        const alerts = [
          { message: 'Rain risk increased 30% → 78%. Consider delaying your activity.', severity: 'HIGH_RISK' },
          { message: 'Wind gusts rising to 42 km/h. Exposed routes now high risk.', severity: 'HIGH_RISK' },
          { message: 'Visibility dropped to 2.1 km. Caution advised on ghat roads.', severity: 'MODERATE' },
        ];
        const alert = alerts[Math.floor(Math.random() * alerts.length)];

        // Mutate first few forecast blocks to simulate deterioration
        const blocks = [...(get().forecastBlocks || [])];
        if (blocks.length > 0) {
          blocks[0] = { ...blocks[0], rainProbability: 78, windSpeed: 42 };
          if (blocks[1]) blocks[1] = { ...blocks[1], rainProbability: 65, windSpeed: 36 };
        }

        set({
          simulationActive: true,
          simulatedAlert: alert,
          forecastBlocks: blocks,
        });

        // Auto-clear alert after 8 seconds
        setTimeout(() => set({ simulationActive: false, simulatedAlert: null }), 8000);
      },

      // ─── Reset ────────────────────────────────────────────────────
      resetPlanner: () =>
        set({
          selectedActivity: null,
          origin: null,
          destination: null,
          routeMode: 'point',
          selectedDate: 'today',
          startTime: '07:00',
          endTime: '11:00',
          rainLimit: 40,
          windGustMax: 30,
          riskResult: null,
          isEvaluating: false,
          liveMonitoring: false,
          simulatedAlert: null,
          screen: 'activity_selection',
        }),
    }),
    {
      name: 'weather-action-store',
      // Only persist user preferences, not transient weather data
      partialize: (state) => ({
        userType: state.userType,
        onboardingDone: state.onboardingDone,
        location: state.location,
        rainLimit: state.rainLimit,
        windGustMax: state.windGustMax,
        language: state.language,
        personalPreferences: state.personalPreferences,
        savedPlaces: state.savedPlaces,
        savedPlans: state.savedPlans,
      }),
    }
  )
);

export default useAppStore;
